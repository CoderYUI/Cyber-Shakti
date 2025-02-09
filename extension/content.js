const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

function findImagesAndAddButtons() {
    const images = document.querySelectorAll('img');

    images.forEach(image => {
        if (image.dataset.detectButtonAdded) {
            return;
        }

        const checkImageAndAddButton = () => {
            const width = image.offsetWidth || image.naturalWidth;
            const height = image.offsetHeight || image.naturalHeight;

            if (width > 80 && height > 80) {
                addDetectButton(image);
                image.dataset.detectButtonAdded = true;
            }
        };

        if (image.complete) {
            checkImageAndAddButton();
        } else {
            image.addEventListener('load', checkImageAndAddButton);
        }
    });
}


function addDetectButton(image) {
    const button = document.createElement('button');
    button.innerText = 'Detect Deepfake';
    button.id = 'detect-button'

    Object.assign(button.style, {
        position: 'absolute',
        zIndex: '1000',
        backgroundColor: 'rgb(22, 24, 28)',
        color: 'white',
        border: 'none',
        padding: '8px 16px',
        cursor: 'pointer',
        borderRadius: '16px',
        fontSize: '14px',
        fontWeight: '500',
        fontFamily: '"DM Sans", sans-serif',
        transition: 'all 0.3s ease',
        opacity: '0.1',
        border: 'solid 1px grey'
    });

    button.addEventListener('mouseenter', () => {
        button.style.opacity = '1';
    });

    button.addEventListener('mouseleave', () => {
        button.style.opacity = '0.1';
    });

    const updateButtonPosition = () => {
        const rect = image.getBoundingClientRect();
        button.style.top = `${rect.top + window.scrollY + 10}px`;
        button.style.left = `${rect.left + window.scrollX + 10}px`;
    };

    button.addEventListener('click', async (e) => {
        e.stopPropagation();
        console.log('Detecting deepfake for:', image.src);
    
        try {
            // Fetch the image URL as a Blob
            const response = await fetch(image.src);
            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.statusText}`);
            }
            
            const blob = await response.blob();
            const contentType = blob.type || 'image/png';
            
            // Create a File object with proper MIME type
            const imageFile = new File([blob], `image${Date.now()}.png`, { 
                type: contentType
            });
    
            const formData = new FormData();
            formData.append('mediaFile', imageFile);
    
            // Send to backend
            const detectResponse = await fetch('http://127.0.0.1:8000/classify', {
                method: 'POST',
                body: formData,
            });
    
            if (!detectResponse.ok) {
                const errorData = await detectResponse.json();
                throw new Error(errorData.error || 'Detection failed');
            }
    
            const result = await detectResponse.json();
            console.log('Detection result:', result);
    
            const prediction = parseFloat(result.best_prediction).toFixed(6);
            
            chrome.runtime.sendMessage({
                action: "updateResult",
                data: {
                    best_prediction: prediction,
                    classification: result.classification
                }
            });
    
        } catch (error) {
            console.error('Error:', error);
            chrome.runtime.sendMessage({
                action: "updateResult",
                data: { error: error.message }
            });
        }
    });
    


    window.addEventListener('scroll', updateButtonPosition);
    window.addEventListener('resize', updateButtonPosition);

    updateButtonPosition();
    document.body.appendChild(button);

}

const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
        if (mutation.addedNodes.length) {
            findImagesAndAddButtons();
        }
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

findImagesAndAddButtons();
setInterval(findImagesAndAddButtons, 2000);

async function sendToBackend(file) {
    try {
        const formData = new FormData();
        formData.append('mediaFile', file);

        const response = await fetch('http://localhost:8000/classify', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to process file');
        }

        const result = await response.json();
        chrome.runtime.sendMessage({
            action: "updateResult",
            data: result
        });
    } catch (error) {
        console.error('Error:', error);
        chrome.runtime.sendMessage({
            action: "updateResult",
            data: { error: error.message }
        });
    }
}

// Listen for file input changes
document.addEventListener('change', function(e) {
    if (e.target && e.target.type === 'file') {
        const file = e.target.files[0];
        if (file) {
            sendToBackend(file);
        }
    }
});
