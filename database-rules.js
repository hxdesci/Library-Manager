const databaseRules = {
    rules: {
        ".read": "auth != null",
        ".write": false,
        "users": {
            "$uid": {
                ".read": "auth != null && ($uid === auth.uid || root.child('users').child(auth.uid).child('role').val() === 'administrator')",
                ".write": "auth != null && ($uid === auth.uid || root.child('users').child(auth.uid).child('role').val() === 'administrator')",
                "email": { ".validate": "newData.isString()" },
                "role": { ".validate": "newData.isString() && (newData.val() === 'administrator' || newData.val() === 'student')" }
            }
        },
        "books": {
            ".read": "auth != null",
            ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'administrator'",
            "$bookId": {
                ".validate": "newData.hasChildren(['title', 'author', 'year', 'quantity'])"
            }
        },
        "borrows": {
            ".read": "auth != null",
            ".write": "auth != null",
            "$borrowId": {
                ".validate": "newData.hasChildren(['userId', 'bookId', 'borrowDate'])"
            }
        }
    }
};

// Function to set database rules
async function setDatabaseRules() {
    try {
        const database = firebase.database();
        await database.ref().set({
            ".settings": {
                "rules": databaseRules
            }
        });
        console.log('Database rules updated successfully');
    } catch (error) {
        console.error('Error updating database rules:', error);
    }
}

// Export the rules and setter function
window.databaseRules = databaseRules;
window.setDatabaseRules = setDatabaseRules;
