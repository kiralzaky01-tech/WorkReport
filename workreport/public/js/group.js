import {
    auth,
    db
} from "./firebase.js";


import {
    onAuthStateChanged
} from
    "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


import {
    doc,
    getDoc,
    getDocs,
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from
    "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


let currentUser = null;

let groupId = null;

let groupData = null;


// ========================================
// GET GROUP ID
// ========================================

const params =
    new URLSearchParams(
        window.location.search
    );


groupId =
    params.get("id");


if (!groupId) {

    window.location.href =
        "dashboard.html";
}


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


        await loadGroup();

    }
);


// ========================================
// LOAD GROUP
// ========================================

async function loadGroup() {

    const groupRef =
        doc(
            db,
            "groups",
            groupId
        );


    const groupSnap =
        await getDoc(groupRef);


    if (!groupSnap.exists()) {

        alert(
            "Grup tidak ditemukan."
        );

        window.location.href =
            "dashboard.html";

        return;
    }


    groupData =
        groupSnap.data();


    /*
        Pemeriksaan tambahan di client.
        Security Rules tetap menjadi
        perlindungan utama.
    */

    if (
        !groupData.members
            ?.includes(
                currentUser.uid
            )
    ) {

        alert(
            "Kamu bukan anggota grup ini."
        );

        window.location.href =
            "dashboard.html";

        return;
    }


    document.getElementById(
        "groupName"
    ).textContent =
        groupData.name;


    document.getElementById(
        "groupCode"
    ).textContent =
        `Kode Grup: ${groupData.code}`;


    document.getElementById(
        "memberCount"
    ).textContent =
        groupData.members?.length || 0;


    await loadMembers();

    await loadTasks();

}


// ========================================
// LOAD MEMBERS
// ========================================

async function loadMembers() {

    const container =
        document.getElementById(
            "memberList"
        );


    container.innerHTML = "";


    for (
        const uid
        of groupData.members || []
    ) {

        const userSnap =
            await getDoc(
                doc(
                    db,
                    "users",
                    uid
                )
            );


        if (
            !userSnap.exists()
        ) {
            continue;
        }


        const user =
            userSnap.data();


        const isOwner =
            uid ===
            groupData.ownerId;


        container.innerHTML += `

            <div class="member">

                <div class="avatar">
                    ${getInitial(user.name)}
                </div>

                <div>

                    <strong>
                        ${escapeHTML(user.name)}
                    </strong>

                    <p>
                        ${escapeHTML(user.email)}
                    </p>

                </div>

                ${
                    isOwner
                    ? `
                        <span class="owner-badge">
                            Pemilik
                        </span>
                    `
                    : ""
                }

            </div>

        `;

    }

}


// ========================================
// LOAD TASKS
// ========================================

async function loadTasks() {

    const container =
        document.getElementById(
            "taskList"
        );


    const taskSnapshot =
        await getDocs(
            collection(
                db,
                "groups",
                groupId,
                "tasks"
            )
        );


    container.innerHTML = "";


    let total = 0;

    let done = 0;

    let pending = 0;


    if (
        taskSnapshot.empty
    ) {

        container.innerHTML = `

            <div class="empty">

                <h3>
                    Belum ada pekerjaan
                </h3>

                <p>
                    Tambahkan pekerjaan pertama untuk grup ini.
                </p>

            </div>

        `;

    }


    taskSnapshot.forEach(
        taskDoc => {

            total++;


            const task =
                taskDoc.data();


            if (
                task.status ===
                "Selesai"
            ) {

                done++;

            } else {

                pending++;

            }


            const status =
                getTaskStatus(
                    task
                );


            container.innerHTML += `

                <div class="task-card">

                    <div class="task-main">

                        <div>

                            <span
                                class="task-status ${status.class}"
                            >
                                ${status.text}
                            </span>

                            <h3>
                                ${escapeHTML(
                                    task.description
                                )}
                            </h3>

                        </div>


                        <div class="task-date">

                            <p>
                                📅 Dibuat:
                                ${formatDate(
                                    task.date
                                )}
                            </p>

                            <p>
                                ⏰ Deadline:
                                ${formatDate(
                                    task.deadline
                                )}
                            </p>

                        </div>

                    </div>


                    <div class="task-actions">

                        ${
                            task.status !== "Selesai"
                            ? `
                                <button
                                    class="btn-success"
                                    onclick="completeTask('${taskDoc.id}')"
                                >
                                    ✓ Selesai
                                </button>
                            `
                            : ""
                        }


                        ${
                            task.createdBy === currentUser.uid ||
                            groupData.ownerId === currentUser.uid
                            ? `
                                <button
                                    class="btn-danger"
                                    onclick="removeTask('${taskDoc.id}')"
                                >
                                    🗑 Hapus
                                </button>
                            `
                            : ""
                        }

                    </div>

                </div>

            `;

        }
    );


    document.getElementById(
        "taskCount"
    ).textContent =
        total;


    document.getElementById(
        "pendingCount"
    ).textContent =
        pending;


    document.getElementById(
        "doneCount"
    ).textContent =
        done;

}


// ========================================
// ADD TASK
// ========================================

const taskForm =
    document.getElementById(
        "taskForm"
    );


taskForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const date =
            document.getElementById(
                "taskDate"
            ).value;


        const deadline =
            document.getElementById(
                "taskDeadline"
            ).value;


        const description =
            document.getElementById(
                "taskDescription"
            )
            .value
            .trim();


        const message =
            document.getElementById(
                "taskMessage"
            );


        try {

            await addDoc(
                collection(
                    db,
                    "groups",
                    groupId,
                    "tasks"
                ),
                {

                    date:

                        date,

                    deadline:

                        deadline,

                    description:

                        description,

                    status:

                        "Belum Dikerjakan",

                    createdBy:

                        currentUser.uid,

                    createdAt:

                        serverTimestamp()

                }
            );


            taskForm.reset();


            message.textContent =
                "Pekerjaan berhasil ditambahkan.";


            message.className =
                "success-text";


            await loadTasks();


        } catch (error) {

            console.error(error);

            message.textContent =
                "Gagal menambahkan pekerjaan.";

        }

    }
);


// ========================================
// COMPLETE TASK
// ========================================

window.completeTask =
    async function (taskId) {

        try {

            await updateDoc(
                doc(
                    db,
                    "groups",
                    groupId,
                    "tasks",
                    taskId
                ),
                {

                    status:
                        "Selesai"

                }
            );


            await loadTasks();


        } catch (error) {

            console.error(error);

            alert(
                "Gagal mengubah status pekerjaan."
            );

        }

    };


// ========================================
// DELETE TASK
// ========================================

window.removeTask =
    async function (taskId) {

        const confirmDelete =
            confirm(
                "Hapus pekerjaan ini?"
            );


        if (!confirmDelete) {
            return;
        }


        try {

            await deleteDoc(
                doc(
                    db,
                    "groups",
                    groupId,
                    "tasks",
                    taskId
                )
            );


            await loadTasks();


        } catch (error) {

            console.error(error);

            alert(
                "Gagal menghapus pekerjaan."
            );

        }

    };


// ========================================
// STATUS
// ========================================

function getTaskStatus(task) {

    if (
        task.status ===
        "Selesai"
    ) {

        return {
            text: "Selesai",
            class: "status-done"
        };

    }


    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );


    const deadline =
        new Date(
            task.deadline +
            "T00:00:00"
        );


    if (
        today > deadline
    ) {

        return {
            text: "Terlambat",
            class: "status-late"
        };

    }


    return {
        text: "Belum Dikerjakan",
        class: "status-pending"
    };

}


// ========================================
// DATE
// ========================================

function formatDate(value) {

    if (!value) {
        return "-";
    }


    return new Date(
        value + "T00:00:00"
    ).toLocaleDateString(
        "id-ID",
        {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );

}


// ========================================
// INITIAL
// ========================================

function getInitial(name) {

    return name
        ? name.charAt(0).toUpperCase()
        : "?";

}


// ========================================
// ESCAPE HTML
// ========================================

function escapeHTML(value) {

    return String(value)

        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}