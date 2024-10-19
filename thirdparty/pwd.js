const correctPasswordHash = "29e7e80a3a0b7b8f2e7f91a98ef40694e5a151b8f667a5c3ccb87ae92ee7bd7d"; // "password"的SHA-256哈希
    const sixHours = 6 * 60 * 60 * 1000; // 6小时的毫秒数
    const maxAttempts = 3;
    const lockoutTime = 10 * 60 * 1000; // 10分钟的毫秒数

    function checkLoginExpiry() {
        const loginTime = localStorage.getItem("loginTime");
        const failedAttempts = parseInt(localStorage.getItem("failedAttempts") || "0");
        const lockoutStart = localStorage.getItem("lockoutStart");

        if (lockoutStart) {
            const lockoutElapsed = new Date().getTime() - parseInt(lockoutStart);
            if (lockoutElapsed < lockoutTime) {
                document.getElementById("error-message").textContent = "超出重试次数，10分钟之后再试.";
                document.getElementById("login-container").style.display = "block";
                return;
            } else {
                localStorage.removeItem("failedAttempts");
                localStorage.removeItem("lockoutStart");
            }
        }

        if (loginTime) {
            const currentTime = new Date().getTime();
            const elapsedTime = currentTime - parseInt(loginTime);
            if (elapsedTime < sixHours) {
                document.getElementById("content").style.display = "block";
            } else {
                localStorage.removeItem("loginTime");
                document.getElementById("login-container").style.display = "block";
            }
        } else {
            document.getElementById("login-container").style.display = "block";
        }
    }

    async function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    async function validatePassword() {
        const inputPassword = document.getElementById("password").value;
        const errorMessage = document.getElementById("error-message");
        const hashedInputPassword = await hashPassword(inputPassword);

        const failedAttempts = parseInt(localStorage.getItem("failedAttempts") || "0");

        if (failedAttempts >= maxAttempts) {
            localStorage.setItem("lockoutStart", new Date().getTime().toString());
            errorMessage.textContent = "超出重试次数，10分钟之后再试.";
            return;
        }

        if (hashedInputPassword === correctPasswordHash) {
            errorMessage.textContent = "";
            localStorage.setItem("loginTime", new Date().getTime().toString());
            localStorage.removeItem("failedAttempts");
            localStorage.removeItem("lockoutStart");
            document.getElementById("login-container").style.display = "none";
            document.getElementById("content").style.display = "block";
        } else {
            const remainingAttempts = maxAttempts - failedAttempts - 1;
            localStorage.setItem("failedAttempts", (failedAttempts + 1).toString());
            errorMessage.textContent = `密码错误. 剩余${remainingAttempts}次机会.`;
            
            if (failedAttempts + 1 >= maxAttempts) {
                localStorage.setItem("lockoutStart", new Date().getTime().toString());
                errorMessage.textContent = "超出重试次数，10分钟之后再试.";
            }
        }
    }

    window.onload = checkLoginExpiry;