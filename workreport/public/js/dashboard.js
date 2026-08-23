import {
    auth,
    db
} from "./firebase.js";


import {
    onAuthStateChanged
} from
    "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    arrayUnion,
    updateDoc,
    serverTimestamp
} from
    "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


let currentUser = null;


// ========================================
// AUTH
// ========================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "login.html";

            return;
        }


        currentUser = user;


        await loadUser();

        await loadGroups();

    }
);


// ========================================
// LOAD USER
// ========================================

async function loadUser() {

    const userRef =
        doc(
            db,
            "users",
            currentUser.uid
        );


    const userSnap =
        await getDoc(userRef);


    if (userSnap.exists()) {

        const userData =
            userSnap.data();


        document.getElementById(
            "welcomeText"
        ).textContent =
            `Selamat datang, ${userData.name}!`;

    }

}


// ========================================
// CREATE GROUP
// ========================================

const createGroupForm =
    document.getElementById(
        "createGroupForm"
    );


if (createGroupForm) {

    createGroupForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const groupName =
                document
                    .getElementById(
                        "groupName"
                    )
                    .value
                    .trim();


            const message =
                document.getElementById(
                    "createGroupMessage"
                );


            if (!groupName) {
                return;
            }


            try {

                const groupRef =
                    doc(
                        collection(
                            db,
                            "groups"
                        )
                    );


                const groupCode =
                    await createUniqueCode();


                await setDoc(
                    groupRef,
                    {

                        name:
                            groupName,

                        code:
                            groupCode,

                        ownerId:
                            currentUser.uid,

                        members:
                            [
                                currentUser.uid
                            ],

                        createdAt:
                            serverTimestamp()

                    }
                );


                // Tambahkan grup ke user

                await updateDoc(
                    doc(
                        db,
                        "users",
                        currentUser.uid
                    ),
                    {

                        groups:
                            arrayUnion(
                                groupRef.id
                            )

                    }
                );


                message.textContent =
                    `Grup berhasil dibuat! Kode: ${groupCode}`;


                message.className =
                    "success-text";


                createGroupForm.reset();


                await loadGroups();


            } catch (error) {

                console.error(error);

                message.textContent =
                    "Gagal membuat grup.";

            }

        }
    );
}


// ========================================
// GENERATE GROUP CODE
// ========================================

async function createUniqueCode() {

    const chars =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";


    let code;


    let exists = true;


    while (exists) {

        let part1 = "";

        let part2 = "";


        for (
            let i = 0;
            i < 4;
            i++
        ) {

            part1 +=
                chars[
                    Math.floor(
                        Math.random() *
                        chars.length
                    )
                ];

        }


        for (
            let i = 0;
            i < 4;
            i++
        ) {

            part2 +=
                chars[
                    Math.floor(
                        Math.random() *
                        chars.length
                    )
                ];

        }


        code =
            `${part1}-${part2}`;


        const q =
            query(
                collection(
                    db,
                    "groups"
                ),
                where(
                    "code",
                    "==",
                    code
                )
            );


        const snapshot =
            await getDocs(q);


        exists =
            !snapshot.empty;

    }


    return code;
}


// ========================================
// JOIN GROUP
// ========================================

const joinGroupForm =
    document.getElementById(
        "joinGroupForm"
    );


if (joinGroupForm) {

    joinGroupForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const code =
                document
                    .getElementById(
                        "groupCode"
                    )
                    .value
                    .trim()
                    .toUpperCase();


            const message =
                document.getElementById(
                    "joinGroupMessage"
                );


            try {

                const q =
                    query(
                        collection(
                            db,
                            "groups"
                        ),
                        where(
                            "code",
                            "==",
                            code
                        )
                    );


                const snapshot =
                    await getDocs(q);


                if (snapshot.empty) {

                    message.textContent =
                        "Kode grup tidak ditemukan.";

                    return;
                }


                const groupDoc =
                    snapshot.docs[0];


                const groupData =
                    groupDoc.data();


                if (
                    groupData.members
                        ?.includes(
                            currentUser.uid
                        )
                ) {

                    message.textContent =
                        "Kamu sudah menjadi anggota grup.";

                    return;
                }


                // Tambahkan user ke grup

                await updateDoc(
                    doc(
                        db,
                        "groups",
                        groupDoc.id
                    ),
                    {

                        members:
                            arrayUnion(
                                currentUser.uid
                            )

                    }
                );


                // Tambahkan grup ke user

                await updateDoc(
                    doc(
                        db,
                        "users",
                        currentUser.uid
                    ),
                    {

                        groups:
                            arrayUnion(
                                groupDoc.id
                            )

                    }
                );


                message.textContent =
                    "Berhasil bergabung ke grup!";


                message.className =
                    "success-text";


                joinGroupForm.reset();


                await loadGroups();


            } catch (error) {

                console.error(error);

                message.textContent =
                    "Gagal bergabung ke grup.";

            }

        }
    );
}


// ========================================
// LOAD GROUPS
// ========================================

async function loadGroups() {

    const userSnap =
        await getDoc(
            doc(
                db,
                "users",
                currentUser.uid
            )
        );


    if (!userSnap.exists()) {
        return;
    }


    const userData =
        userSnap.data();


    const groupIds =
        userData.groups || [];


    const container =
        document.getElementById(
            "groupList"
        );


    container.innerHTML = "";


    if (
        groupIds.length === 0
    ) {

        container.innerHTML = `

            <div class="empty">

                <h3>
                    Belum ada grup
                </h3>

                <p>
                    Buat grup atau gunakan kode untuk bergabung.
                </p>

            </div>

        `;


        updateStatistics(
            0
        );


        return;
    }


    let totalTasks = 0;

    let completedTasks = 0;


    for (
        const groupId
        of groupIds
    ) {

        const groupSnap =
            await getDoc(
                doc(
                    db,
                    "groups",
                    groupId
                )
            );


        if (
            !groupSnap.exists()
        ) {
            continue;
        }


        const group =
            groupSnap.data();


        const tasksSnap =
            await getDocs(
                collection(
                    db,
                    "groups",
                    groupId,
                    "tasks"
                )
            );


        totalTasks +=
            tasksSnap.size;


        tasksSnap.forEach(
            task => {

                if (
                    task.data().status ===
                    "Selesai"
                ) {

                    completedTasks++;

                }

            }
        );


        container.innerHTML += `

            <div class="group-card">

                <div class="group-icon">
                    👥
                </div>

                <div class="group-info">

                    <h3>
                        ${escapeHTML(group.name)}
                    </h3>

                    <p>
                        ${group.members?.length || 0}
                        anggota
                    </p>

                    <span>
                        Kode:
                        <strong>
                            ${group.code}
                        </strong>
                    </span>

                </div>

                <a
                    class="group-open"
                    href="group.html?id=${groupId}"
                >
                    Buka →
                </a>

            </div>

        `;

    }


    updateStatistics(
        groupIds.length,
        totalTasks,
        completedTasks
    );

}


// ========================================
// STATISTICS
// ========================================

function updateStatistics(
    groups = 0,
    tasks = 0,
    completed = 0
) {

    document.getElementById(
        "totalGroups"
    ).textContent =
        groups;


    document.getElementById(
        "totalTasks"
    ).textContent =
        tasks;


    document.getElementById(
        "completedTasks"
    ).textContent =
        completed;


    document.getElementById(
        "pendingTasks"
    ).textContent =
        tasks - completed;

}


// ========================================
// UI
// ========================================

window.showCreateGroup =
    function () {

        document
            .getElementById(
                "createGroupBox"
            )
            .classList
            .toggle("hidden");

        document
            .getElementById(
                "joinGroupBox"
            )
            .classList
            .add("hidden");

    };


window.showJoinGroup =
    function () {

        document
            .getElementById(
                "joinGroupBox"
            )
            .classList
            .toggle("hidden");

        document
            .getElementById(
                "createGroupBox"
            )
            .classList
            .add("hidden");

    };


// ========================================
// ESCAPE HTML
// ========================================

function escapeHTML(value) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}