const GOOGLE_CLIENT_ID = '699810988686-66196fruch6fc6i4jp13r8h801kbnips.apps.googleusercontent.com';

const closeAuthBtn = document.getElementById('close-auth-btn');
const transparencyAuth = document.getElementById('transparency-auth');
const singUpBtn = document.getElementById('sign-up-screen');
const logInBtn = document.getElementById('log-in-screen');

let activeMenuSliders = [];

document.addEventListener('DOMContentLoaded', () => {

    const stranice = {
        'home-view': document.getElementById('home-page'),
        'menu-view': document.getElementById('menu-page'),
        'policy-view': document.getElementById('policy-page'),
        'contact-view': document.getElementById('contact-page')
    };

    const logInScreen = document.getElementById('log-in-screen');
    const signUpScreen = document.getElementById('sign-up-screen');

    function switchPage(targetView) {
        if (!stranice[targetView]) return;

        Object.keys(stranice).forEach(key => {
            if (stranice[key]) {
                stranice[key].classList.add('hidden');
            }
        });

        stranice[targetView].classList.remove('hidden');

        if (targetView === 'menu-view') {
            setTimeout(() => {
                const galleries = document.querySelectorAll('.gallery');
                galleries.forEach(gallery => {
                    const flkty = Flickity.data(gallery);
                    if (flkty) {
                        flkty.resize();
                        flkty.reposition();
                    }
                });
            }, 50);
        }

        window.scrollTo(0, 0);
    }

    function switchAuth(authValue) {
        if (!logInScreen || !signUpScreen) return;

        if (authValue === 'sign-up') {
            logInScreen.classList.add('hidden');
            signUpScreen.classList.remove('hidden');
        } else if (authValue === 'log-in') {
            signUpScreen.classList.add('hidden');
            logInScreen.classList.remove('hidden');
        }
    }

    document.querySelectorAll('[data-target]').forEach(link => {
        link.addEventListener('click', (e) => {
            const target = link.getAttribute('data-target');

            if (stranice[target]) {
                e.preventDefault();
                switchPage(target);
            }
            else if (target === 'sign-up' || target === 'log-in') {
                e.preventDefault();
                switchAuth(target);
            }
        });
    });

    switchPage('home-view');
    switchAuth('log-in');

    const signInBtn = document.getElementById('sign-in');
    const closeAuthBtn = document.getElementById('close-auth-btn');
    const transparencyAuth = document.getElementById('transparency-auth');

    if (signInBtn && transparencyAuth) {
        signInBtn.addEventListener('click', () => transparencyAuth.classList.remove('hidden'));
    }

    if (closeAuthBtn && transparencyAuth) {
        closeAuthBtn.addEventListener('click', () => transparencyAuth.classList.add('hidden'));
    }

    if (transparencyAuth) {
        transparencyAuth.addEventListener('click', (e) => {
            if (e.target === transparencyAuth) transparencyAuth.classList.add('hidden');
        });
    }

});

window.addEventListener('load', function () {
    const categoryGalleries = document.querySelectorAll('.gallery');

    categoryGalleries.forEach((carouselElem) => {
        const flkty = new Flickity(carouselElem, {
            cellAlign: 'left',
            wrapAround: true,
            prevNextButtons: false,
            pageDots: false,
            freeScroll: true,
            contain: false
        });

        carouselElem.addEventListener('wheel', function (event) {
            event.preventDefault();

            const speedFactor = 0.8;

            let force = (event.deltaY / 10) * -speedFactor;

            flkty.applyForce(force);
            flkty.startAnimation();
            flkty.dragEnd();

        }, { passive: false });
    });
});

document.addEventListener("DOMContentLoaded", function () {

    const categoryGalleries = document.querySelectorAll('.gallery');

    if (categoryGalleries.length > 0) {
        categoryGalleries.forEach((carouselElem) => {

            const flktyInstance = new Flickity(carouselElem, {
                wrapAround: true,
                prevNextButtons: false,
                pageDots: false,
                freeScroll: true,
                contain: true
            });

            activeMenuSliders.push(flktyInstance);

            carouselElem.addEventListener('wheel', function (event) {
                event.preventDefault();

                if (event.deltaY > 0) {
                    flktyInstance.next();
                } else {
                    flktyInstance.previous();
                }
            }, { passive: false });
        });
    }
});

function fixMenuLayout() {
    if (activeMenuSliders.length > 0) {
        activeMenuSliders.forEach(slider => slider.resize());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const authForm = document.querySelector('#authentication-screen form');
    const emailInput = document.querySelector('#authentication-screen input[type="email"]');
    const passwordInput = document.querySelector('#authentication-screen input[type="password"]');
    const signInNavBtn = document.getElementById('sign-in');
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const googleAuthBtn = document.getElementById('google-auth-btn');
    const transparencyAuthModal = document.getElementById('transparency-auth');

    async function refreshSession() {
        const res = await fetch('/api/session');
        const data = await res.json();
        if (data.loggedIn) {
            signInNavBtn.textContent = 'Log out';
            signInNavBtn.dataset.loggedIn = 'true';
        } else {
            signInNavBtn.textContent = 'Sign in';
            signInNavBtn.dataset.loggedIn = 'false';
        }
    }

    if (signInNavBtn) {
        signInNavBtn.addEventListener('click', async (e) => {
            if (signInNavBtn.dataset.loggedIn === 'true') {
                e.stopImmediatePropagation();
                await fetch('/api/logout', { method: 'POST' });
                await refreshSession();
            }
        });
    }

    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitter = e.submitter;
            const email = emailInput.value;
            const password = passwordInput.value;
            const endpoint = submitter && submitter.dataset.target === 'sign-up-btn' ? '/api/signup' : '/api/login';

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || 'Something went wrong');
                return;
            }

            await refreshSession();
            transparencyAuthModal.classList.add('hidden');
            authForm.reset();
        });
    }

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = prompt('Enter your account email:');
            if (!email) return;

            await fetch('/api/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            alert('If that email is registered, a reset link has been sent.');
        });
    }

    if (googleAuthBtn) {
        googleAuthBtn.addEventListener('click', (e) => {
            e.preventDefault();
            google.accounts.id.prompt();
        });
    }

    function initGoogleAuth() {
        if (!(window.google && google.accounts && google.accounts.id)) {
            setTimeout(initGoogleAuth, 200);
            return;
        }

        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: async (response) => {
                const res = await fetch('/api/google-auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ credential: response.credential })
                });

                const data = await res.json();

                if (!res.ok) {
                    alert(data.error || 'Google sign-in failed');
                    return;
                }

                await refreshSession();
                transparencyAuthModal.classList.add('hidden');
            }
        });
    }

    initGoogleAuth();
    refreshSession();
});
