function reset() {
        if (confirm("Are you sure you want to reset all of your DTT data?") == true) {
                localStorage.clear();
        }
}
document.getElementById('reset').onclick = reset;