package com.haldun.kidsbiblestories;

import android.content.Intent;
import android.util.Log;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;

@CapacitorPlugin(name = "GoogleAuth")
public class GoogleAuthPlugin extends Plugin {

    private static final String TAG = "GoogleAuthPlugin";

    private GoogleSignInClient googleSignInClient;
    private GoogleSignInClient profileSignInClient;

    @Override
    public void load() {
        String serverClientId = getContext().getString(R.string.server_client_id).trim();
        GoogleSignInOptions profileOptions = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestEmail()
                .requestProfile()
                .build();
        profileSignInClient = GoogleSignIn.getClient(getActivity(), profileOptions);

        GoogleSignInOptions.Builder tokenBuilder = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestEmail()
                .requestProfile();

        // The backend verifies this ID token and creates/links the app account.
        // Without requestIdToken(), new Google users incorrectly fall through to
        // the legacy email/register bridge and can fail its phone validation.
        if (!serverClientId.isEmpty()) {
            tokenBuilder.requestIdToken(serverClientId);
        } else {
            Log.w(TAG, "server_client_id is empty; Google ID token will be unavailable");
        }

        GoogleSignInOptions gso = tokenBuilder.build();
        googleSignInClient = GoogleSignIn.getClient(getActivity(), gso);
        Log.d(TAG, "Google Sign-In configured for profile and backend ID token");
    }

    @PluginMethod
    public void signIn(PluginCall call) {
        if (googleSignInClient == null) {
            call.reject(
                    "Google Sign-In could not be initialized.",
                    "CONFIG_MISSING"
            );
            return;
        }

        Log.d(TAG, "Starting Google Sign-In");
        Intent signInIntent = googleSignInClient.getSignInIntent();
        startActivityForResult(call, signInIntent, "handleSignInResult");
    }

    @PluginMethod
    public void signOut(PluginCall call) {
        if (googleSignInClient == null) {
            call.resolve();
            return;
        }

        googleSignInClient.signOut().addOnCompleteListener(task -> {
            if (profileSignInClient == null || profileSignInClient == googleSignInClient) {
                call.resolve();
                return;
            }
            profileSignInClient.signOut().addOnCompleteListener(profileTask -> call.resolve());
        });
    }

    @ActivityCallback
    private void handleSignInResult(PluginCall call, ActivityResult result) {
        if (call == null) return;

        Log.d(TAG, "Google Sign-In returned resultCode: " + result.getResultCode());
        Intent data = result.getData();
        Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
        try {
            GoogleSignInAccount account = task.getResult(ApiException.class);
            resolveAccount(call, account);
        } catch (ApiException e) {
            int statusCode = e.getStatusCode();

            // Code 10 means the Web Client ID is not paired with this package
            // and SHA-1 in Google Cloud. Keep sign-in usable through the legacy
            // profile bridge while the Cloud OAuth configuration is corrected.
            if (statusCode == 10 && profileSignInClient != null) {
                Log.w(TAG, "ID-token configuration rejected; retrying profile-only Google Sign-In");
                profileSignInClient.signOut().addOnCompleteListener(ignored -> {
                    Intent fallbackIntent = profileSignInClient.getSignInIntent();
                    startActivityForResult(call, fallbackIntent, "handleProfileSignInResult");
                });
                return;
            }

            String message = "Google Sign-In failed: " + statusCode + " (" + getStatusName(statusCode) + ")";
            Log.e(TAG, message, e);
            call.reject(message, String.valueOf(statusCode), e);
        }
    }

    @ActivityCallback
    private void handleProfileSignInResult(PluginCall call, ActivityResult result) {
        if (call == null) return;

        Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(result.getData());
        try {
            resolveAccount(call, task.getResult(ApiException.class));
        } catch (ApiException e) {
            int statusCode = e.getStatusCode();
            String message = "Google Sign-In failed: " + statusCode + " (" + getStatusName(statusCode) + ")";
            Log.e(TAG, message, e);
            call.reject(message, String.valueOf(statusCode), e);
        }
    }

    private void resolveAccount(PluginCall call, GoogleSignInAccount account) {
        JSObject ret = new JSObject();
        ret.put("idToken", account.getIdToken() != null ? account.getIdToken() : "");
        ret.put("email", account.getEmail() != null ? account.getEmail() : "");
        ret.put("displayName", account.getDisplayName() != null ? account.getDisplayName() : "");
        ret.put("givenName", account.getGivenName() != null ? account.getGivenName() : "");
        ret.put("familyName", account.getFamilyName() != null ? account.getFamilyName() : "");
        ret.put("id", account.getId() != null ? account.getId() : "");
        if (account.getPhotoUrl() != null) {
            ret.put("photoUrl", account.getPhotoUrl().toString());
        }
        call.resolve(ret);
    }

    private String getStatusName(int statusCode) {
        switch (statusCode) {
            case 7:
                return "NETWORK_ERROR";
            case 8:
                return "INTERNAL_ERROR";
            case 10:
                return "DEVELOPER_ERROR";
            case 12500:
                return "SIGN_IN_FAILED";
            case 12501:
                return "SIGN_IN_CANCELLED";
            case 12502:
                return "SIGN_IN_CURRENTLY_IN_PROGRESS";
            default:
                return "UNKNOWN";
        }
    }

}
