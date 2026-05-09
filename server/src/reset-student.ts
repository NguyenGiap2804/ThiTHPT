import db from "./lib/database";
import bcrypt from "bcryptjs";

async function resetPassword() {
  const email = "student@thpt.edu.vn";
  const newPassword = "student123";
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  console.log(`Resetting password for ${email} to ${newPassword}...`);

  try {
    const rows = await db.executeNonQuery(
      "UPDATE Users SET password = @password WHERE email = @email",
      { password: hashedPassword, email: email }
    );
    
    if (rows > 0) {
      console.log("SUCCESS: Password updated!");
    } else {
      console.log("FAILURE: User not found!");
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

resetPassword();
