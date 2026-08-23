import {
    auth,
    db
} from "./firebase.js";


import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from
    "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


import {
    doc,
    setDoc,
    serverTimestamp
} from
    "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ========================================
// REGISTER
// ========================================

const registerForm =
    document.getElementById("registerForm");


if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const name =
                document.getElementById("name").value.trim();


            const email =
                document.getElementById("email").value.trim();


            const password =
                document.getElementById("password").value;


            const message =
                document.getElementById("message");


            try {

                const result =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const user =
                    result.user;


                // Simpan profil user

                await setDoc(
                    doc(
                        db,
                        "users",
                        user.uid
                    ),
                    {

                        name: name,

                        email: email,

                        createdAt:
                            serverTimestamp()

                    }
                );


                message.textContent =
                    "Akun berhasil dibuat!";


                message.className =
                    "message success";


                setTimeout(() => {

                    window.location.href =
                        "dashboard.html";

                }, 1000);


            } catch (error) {

                message.textContent =
                    getFirebaseError(error.code);

                message.className =
                    "message error";
            }

        }
    );
}


// ========================================
// LOGIN
// ========================================

const loginForm =
    document.getElementById("loginForm");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const email =
                document.getElementById("email").value.trim();


            const password =
                document.getElementById("password").value;


            const message =
                document.getElementById("message");


            try {

                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


                window.location.href =
                    "dashboard.html";


            } catch (error) {

                message.textContent =
                    getFirebaseError(error.code);

                message.className =
                    "message error";

            }

        }
    );
}


// ========================================
// LOGOUT
// ========================================

window.logout = async function () {

    await signOut(auth);

    window.location.href =
        "login.html";
};


// ========================================
// AUTH GUARD
// ========================================

onAuthStateChanged(
    auth,
    (user) => {

        const currentPage =
            window.location.pathname;


        const protectedPage =
            currentPage.includes(
                "dashboard.html"
            ) ||
            currentPage.includes(
                "group.html"
            );


        if (
            protectedPage &&
            !user
        ) {

            window.location.href =
                "login.html";

        }

    }
);


// ========================================
// FIREBASE ERROR
// ========================================

function getFirebaseError(code) {

    switch (code) {

        case "auth/email-already-in-use":
            return "Email sudah digunakan.";

        case "auth/invalid-email":
            return "Email tidak valid.";

        case "auth/weak-password":
            return "Password terlalu lemah.";

        case "auth/invalid-credential":
            return "Email atau password salah.";

        default:
            return "Terjadi kesalahan. Silakan coba lagi.";

    }
}