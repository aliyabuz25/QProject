from PIL import Image
import os

path = r"C:\Users\User\AppData\Local\Programs\Microsoft VS Code\public\assets\figma-export\gamepad2.png"
if not os.path.exists(path):
    print("File not found:", path)
    exit(1)

img = Image.open(path).convert("RGBA")
w, h = img.size
print(f"Size: {w}x{h}")

cols = 48
rows_out = []
for gy in range(cols):
    row = ""
    for gx in range(cols):
        px = int(gx * w / cols + w / cols / 2)
        py = int(gy * h / cols + h / cols / 2)
        r,g,b,a = img.getpixel((min(px,w-1), min(py,h-1)))
        row += "#" if a > 60 else "."
    rows_out.append(row)
print("\n".join(rows_out))
