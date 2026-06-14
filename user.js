export function getUserId() {
    let uid = localStorage.getItem('sakhi_uid');
    if (!uid) {
        uid = 'user_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('sakhi_uid', uid);
    }
    return uid;
}
