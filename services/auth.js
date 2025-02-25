class AuthService {
    static API_KEY = 'BCS4dlwqJhXO8Wm6MPzIbArXu5PMkFiGnmihcIm24TovzDaow0lut8197qruUaJUWAyTBoNs4jtfkLGqxeWAXSo';

    static validateKey(key) {
        return key === this.API_KEY;
    }

    static checkSession() {
        if (!firebase.auth().currentUser) {
            localStorage.clear();
            sessionStorage.clear();
            window.location.replace('/login.html');
            throw new Error('NO_SESSION');
        }
    }

    static async login(email, password) {
        try {
            if (!this.validateKey(this.API_KEY)) {
                throw new Error('Invalid API key');
            }
            const result = await firebase.auth().signInWithEmailAndPassword(email, password);
            const userRole = await this.getUserRole(result.user.uid);
            return { user: result.user, role: userRole };
        } catch (error) {
            throw error;
        }
    }

    static async getUserRole(uid) {
        const snapshot = await firebase.database().ref(`users/${uid}`).once('value');
        return snapshot.val()?.role || 'student';
    }

    static async setupNewUser(user) {
        const userRef = firebase.database().ref(`users/${user.uid}`);
        const snapshot = await userRef.once('value');
        if (!snapshot.exists()) {
            await userRef.set({
                email: user.email,
                role: 'student'
            });
        }
    }

    static onAuthStateChanged(callback) {
        return firebase.auth().onAuthStateChanged((user) => {
            if (!user) {
                localStorage.clear();
                sessionStorage.clear();
            }
            callback(user);
        });
    }

    static async logout() {
        try {
            document.body.setAttribute('data-role', '');
            localStorage.clear();
            sessionStorage.clear();
            await firebase.auth().signOut();
            window.location.replace('/login.html');
        } catch (error) {
            console.error('Logout error:', error);
            window.location.replace('/login.html');
        }
    }
}

window.AuthService = AuthService;

export default AuthService;
