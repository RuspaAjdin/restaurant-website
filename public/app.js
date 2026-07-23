//Variable for the flickity sliders

let activeMenuSliders = [];

//LOADS FLICKITY

window.addEventListener('load', function() {
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

            // REMINDER THIS CHANGES FLICKITY SCROLL SPEED (lower = slower, higher = faster)
            const speedFactor = 0.8; 

            let force = (event.deltaY / 10) * -speedFactor;

            flkty.applyForce(force);
            flkty.startAnimation();
            flkty.dragEnd();
            
        }, { passive: false });
    });
});


// LOGIC FOR FLICKITY SLIDERS 

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