const initialBooks = [
    {
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        year: 1925,
        quantity: 5,
        isAvailable: true
    },
    {
        title: "To Kill a Mockingbird",
        author: "Harper Lee",
        year: 1960,
        quantity: 3,
        isAvailable: true
    },
    {
        title: "1984",
        author: "George Orwell",
        year: 1949,
        quantity: 4,
        isAvailable: true
    }
];

const initialUsers = [
    {
        email: "admin@library.com",
        role: "admin",
        displayName: "System Admin"
    },
    {
        email: "librarian@library.com",
        role: "librarian",
        displayName: "Head Librarian"
    }
];

// Add default admin account
const defaultAdmin = {
    email: "admin@library.com",
    password: "Admin123!", // Change this to a secure password
    role: "admin"
};

async function createAdminAccount() {
    try {
        const userCredential = await firebase.auth()
            .createUserWithEmailAndPassword(defaultAdmin.email, defaultAdmin.password);
        
        await firebase.database().ref('users/' + userCredential.user.uid).set({
            email: defaultAdmin.email,
            role: defaultAdmin.role
        });

        console.log("Admin account created successfully!");
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            console.log("Admin account already exists");
        } else {
            console.error("Error creating admin account:", error);
        }
    }
}

// Initialize database
async function initializeDatabase() {
    try {
        // Add initial books
        const booksRef = firebase.database().ref('books');
        initialBooks.forEach(book => {
            booksRef.push(book);
        });

        // Add initial users
        const usersRef = firebase.database().ref('users');
        initialUsers.forEach(user => {
            // Create Firebase auth user
            firebase.auth().createUserWithEmailAndPassword(user.email, "Password123!")
                .then((userCredential) => {
                    // Add user data to database
                    usersRef.child(userCredential.user.uid).set(user);
                })
                .catch((error) => {
                    if (error.code !== 'auth/email-already-in-use') {
                        console.error("Error creating user:", error);
                    }
                });
        });

        console.log("Database initialized successfully!");
    } catch (error) {
        console.error("Error initializing database:", error);
    }
}

// Call this function to create admin account
// createAdminAccount();

// Add button to index.html to call this
