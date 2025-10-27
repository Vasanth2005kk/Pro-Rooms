import os
import subprocess
import sys
from rooms.db.db import db_create
import platform

# Paths
base_dir = os.path.dirname(os.path.abspath(__file__))
venv_dir = os.path.join(base_dir, "venv")
db_folder = os.path.join(base_dir, "rooms", "db")
requirements_file = os.path.join(base_dir, "requirements.txt")

# Get OS-specific paths for python and pip inside venv
def get_venv_paths(venv_dir):
    if platform.system() == "Windows":
        python_path = os.path.join(venv_dir, "Scripts", "python.exe")
        pip_path = os.path.join(venv_dir, "Scripts", "pip.exe")
    else:
        python_path = os.path.join(venv_dir, "bin", "python")
        pip_path = os.path.join(venv_dir, "bin", "pip")
    return python_path, pip_path

python_path, pip_path = get_venv_paths(venv_dir)

# Create virtual environment if not exists
if not os.path.exists(venv_dir):
    print("Creating virtual environment...")
    subprocess.run([sys.executable, "-m", "venv", venv_dir], check=True)
    print("Virtual Environment Created Successfully ✅")

    # Install packages from requirements.txt
    if os.path.exists(requirements_file):
        with open(requirements_file, 'r') as f:
            for pkg in f:
                pkg = pkg.strip()
                if pkg:  # skip empty lines
                    print(f"Installing package: {pkg}")
                    subprocess.run([pip_path, "install", pkg], check=True)
        print("✅ All packages installed from requirements.txt")
        # Create database using db_create
        db_create(db_folder)
        # Run your Flask app using the venv python
        subprocess.run([python_path, os.path.join(base_dir, "app.py")])
    else:
        print(f"❌ requirements.txt not found at {requirements_file}")
else:
    print("Allready Virtual Environment Created ✅ !!!")
    subprocess.run([python_path, os.path.join(base_dir, "app.py")])


