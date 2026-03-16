// Arkhe Aula Web - Main Interactions
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Fixed Header on Scroll
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (window.scrollY > 50) {
        header.style.padding = '0.5rem 0';
        header.style.background = 'rgba(3, 7, 18, 0.95)';
    } else {
        header.style.padding = '1rem 0';
        header.style.background = 'rgba(3, 7, 18, 0.8)';
    }
});
