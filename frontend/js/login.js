(() => {
  const form = document.getElementById("loginForm");
  const tabSignIn = document.getElementById("tabSignIn");
  const tabSignUp = document.getElementById("tabSignUp");
  const groupName = document.getElementById("groupName");
  const formTitle = document.getElementById("formTitle");
  const formSubtitle = document.getElementById("formSubtitle");
  const btnSubmitText = document.getElementById("btnSubmitText");
  const switchText = document.getElementById("switchText");
  const btnSwitchMode = document.getElementById("btnSwitchMode");
  const btnTogglePw = document.getElementById("btnTogglePw");
  const userPassword = document.getElementById("userPassword");
  const eyeIcon = document.getElementById("eyeIcon");
  const statusPill = document.getElementById("loginStatus");
  const statusText = document.getElementById("statusText");
  const btnSubmit = document.getElementById("btnSubmit");
  const btnGoogle = document.getElementById("btnGoogle");
  const btnGithub = document.getElementById("btnGithub");

  let isSignUp = false;

  function setMode(signUp) {
    isSignUp = signUp;
    if (tabSignIn && tabSignUp) {
      tabSignIn.classList.toggle("active", !isSignUp);
      tabSignUp.classList.toggle("active", isSignUp);
    }
    if (groupName) groupName.style.display = isSignUp ? "block" : "none";
    if (formTitle) formTitle.textContent = isSignUp ? "Create an account" : "Welcome back";
    if (formSubtitle) formSubtitle.textContent = isSignUp ? "Join AIRA to start using your AI assistant." : "Sign in to access your personal AIRA workspace.";
    if (btnSubmitText) btnSubmitText.textContent = isSignUp ? "Create Account" : "Sign In";
    if (switchText) switchText.textContent = isSignUp ? "Already have an account?" : "Don't have an account?";
    if (btnSwitchMode) btnSwitchMode.textContent = isSignUp ? "Sign in" : "Create one";
  }

  if (tabSignIn) tabSignIn.addEventListener("click", () => setMode(false));
  if (tabSignUp) tabSignUp.addEventListener("click", () => setMode(true));
  if (btnSwitchMode) btnSwitchMode.addEventListener("click", () => setMode(!isSignUp));

  // Password visibility toggle
  if (btnTogglePw && userPassword) {
    btnTogglePw.addEventListener("click", () => {
      const isPw = userPassword.type === "password";
      userPassword.type = isPw ? "text" : "password";
      if (eyeIcon) eyeIcon.textContent = isPw ? "👁‍🗨" : "👁";
    });
  }

  function handleAuthSuccess(providerName) {
    if (btnSubmit) btnSubmit.disabled = true;
    if (statusPill && statusText) {
      statusPill.style.display = "flex";
      statusText.textContent = providerName ? `Connecting with ${providerName}...` : (isSignUp ? "Creating your account..." : "Signing you in...");
    }

    setTimeout(() => {
      if (statusText) statusText.textContent = "Welcome! Redirecting...";
      setTimeout(() => {
        window.location.href = "index.html#home";
      }, 700);
    }, 1000);
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      handleAuthSuccess(null);
    });
  }

  if (btnGoogle) {
    btnGoogle.addEventListener("click", () => handleAuthSuccess("Google"));
  }

  if (btnGithub) {
    btnGithub.addEventListener("click", () => handleAuthSuccess("GitHub"));
  }
})();
