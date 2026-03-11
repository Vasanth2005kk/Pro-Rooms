import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function OtpVerifyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");
  const { login } = useAuth();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const inputsRef = useRef([]);

  useEffect(() => {
    if (!email) {
      navigate("/login");
      return;
    }
    inputsRef.current[0]?.focus();
  }, [email, navigate]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (!/^\d*$/.test(value)) return;

    if (value.length > 1) {
      const pasted = value.slice(0, 6).split("");
      const newOtp = [...otp];
      pasted.forEach((char, i) => { if (index + i < 6) newOtp[index + i] = char; });
      setOtp(newOtp);
      const focusIndex = Math.min(index + pasted.length, 5);
      inputsRef.current[focusIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) return;

    setLoading(true);
    setError(null);
    try {
      const { data } = await authAPI.verifyOtp(email, code);
      login(data.access_token, data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await authAPI.resendOtp(email);
      setTimeLeft(300);
      setOtp(["", "", "", "", "", ""]);
      inputsRef.current[0]?.focus();
      alert("A new OTP has been sent to your email.");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to resend OTP.");
    }
  };

  const formatTime = () => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const allFilled = otp.every((char) => char !== "");

  return (
    <main className="p-0">
      {/* Animated Background Glows */}
      <div className="bg-glows" aria-hidden="true">
        <div className="glow-1"></div>
        <div className="glow-2"></div>
        <div className="glow-3"></div>
        <div className="glow-4"></div>
      </div>

      <div className="otp-page-wrapper d-flex align-items-center justify-content-center min-vh-100 p-3">
        <div className="otp-container-wrapper w-100">
          <div className="card otp-card">
            <div className="card-body p-0">

              <div className="text-center mb-4" id="headerSection">
                <h2 className="gradient-text">Verify Your Account</h2>
                <p className="text-muted">We've sent a 6-digit verification code to</p>
                <div className="email-display d-inline-flex align-items-center gap-2">
                  <i className="fa-regular fa-envelope"></i>
                  <span>{email}</span>
                </div>
                <p className="text-muted mt-2">Please enter the code below to continue</p>
              </div>

              {error && <div className="alert alert-danger mx-4 p-2">{error}</div>}

              <div id="otpSection">
                <form onSubmit={handleVerify}>
                  <div className="otp-container" role="group" aria-label="One-time password input">
                    {otp.map((char, index) => (
                      <input
                        key={index}
                        ref={(el) => (inputsRef.current[index] = el)}
                        type="text"
                        className="otp-input"
                        maxLength="6" // allow paste
                        pattern="\d*"
                        inputMode="numeric"
                        autoComplete="off"
                        value={char}
                        onChange={(e) => handleChange(e, index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        onFocus={(e) => e.target.select()}
                        disabled={timeLeft <= 0}
                      />
                    ))}
                  </div>

                  <div className="timer-section text-center mb-3" id="timerSection">
                    <p className="timer-text mb-0">
                      Code expires in{" "}
                      <span className={`timer-display ${timeLeft <= 0 ? "text-danger" : ""}`}>
                        <i className="far fa-clock"></i>&nbsp;
                        <span id="timer">{timeLeft <= 0 ? "Expired" : formatTime()}</span>
                      </span>
                    </p>
                  </div>

                  <div id="verifyBtnSection" className="mb-3 px-4">
                    <button
                      type="submit"
                      className="btn-gradient w-100"
                      disabled={!allFilled || timeLeft <= 0 || loading}
                    >
                      <span>{loading ? "Verifying..." : "Verify OTP"}</span>
                      <i className="fa-solid fa-arrow-right-circle-fill ms-2"></i>
                    </button>
                  </div>
                </form>
              </div>

              <div className="action-links" id="actionLinks">
                <button type="button" className="btn-link bg-transparent border-0" onClick={handleResend}>
                  <span className="refresh-icon" aria-hidden="true"></span>
                  Resend OTP
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
