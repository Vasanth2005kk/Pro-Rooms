import subprocess
import os


def db_create(current_dir):
    # Build the full path to create_db.sh
    script_path = os.path.join(current_dir, "create_db.sh")

    # Step 1️⃣ — Ensure file exists
    if not os.path.exists(script_path):
        print(f"❌ Error: {script_path} not found!")
        exit(1)

    # Step 2️⃣ — Auto chmod
    subprocess.run(["chmod", "+x", script_path], check=True)
    print(f"✅ Added execute permission to {script_path}")

    # Step 3️⃣ — Run the shell script
    try:
        result = subprocess.run(["bash", script_path], check=True, capture_output=True, text=True)
        print("✅ Shell script executed successfully!")
        print("🔹 Output:\n", result.stdout)
    except subprocess.CalledProcessError as e:
        print("❌ Error while executing the shell script!")
        print("🔻 Error Output:\n", e.stderr)


# Get the current directory (rooms/db)
# current_dir = os.path.dirname(os.path.abspath(__file__))
# db_create(current_dir)