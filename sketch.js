let canvasSize = 280;
let gridSize = 28;
let images = []; // Array to hold denoised images
let currentImageIndex = -1; // Track the current image to display
let duration = 60; // Duration for each image in frames
let timer = 0; // Timer to control frame update
let fadeOutAmount = 255; // Variable for fading out the current image
let fadeInAmount = 0; // Variable for fading in the next image
let fadingIn = false; // Flag to control fading direction
let button 

function setup() {
  createCanvas(canvasSize, canvasSize); // Set the canvas size
  button = select('#generateButton');
  pixelDensity(2); // Apply MSAA (anti-aliasing), increase pixel density
  button.mousePressed(generateImage);
}

function draw() {
  background(0); // Clear the background
  if (currentImageIndex !== -1 && images.length > 0) {
    updateImageDisplay();
  }
}

// Function to update image display logic
function updateImageDisplay() {
  if (timer < duration) {
    timer++;
  } else {
    if (currentImageIndex < images.length - 1) {
      transitionToNextImage();
      button.elt.disabled = true; // Disable the button during transition
    } else {
      button.elt.disabled = false; // Enable the button after the last image
    }
  }

  // Apply fading effects for the images
  applyFadeEffects();
}

// Transition to the next image in the array
function transitionToNextImage() {
  currentImageIndex++; // Move to the next image
  timer = 0; // Reset timer
  fadeOutAmount = 255; // Start fading out the current image
  fadeInAmount = 0; // Start fading in the next image
  fadingIn = true; // Set fading direction
}

// Apply fade-in and fade-out effects
function applyFadeEffects() {
  if (fadingIn) {
    fadeInAmount += 5; // Increase the fade-in amount
    fadeOutAmount -= 5; // Decrease the fade-out amount

    // Clamp values to ensure they stay within valid range
    fadeOutAmount = constrain(fadeOutAmount, 0, 255);
    fadeInAmount = constrain(fadeInAmount, 0, 255);

    if (fadeInAmount >= 255) {
      fadingIn = false; // Stop fading
    }
  }

  // Display the previous image with fade-out effect
  if (currentImageIndex > 0 && images[currentImageIndex - 1]) {
    tint(255, fadeOutAmount); // Apply fade-out effect
    image(images[currentImageIndex - 1], 0, 0, canvasSize, canvasSize); // Display previous image
  }

  // Display the current image with fade-in effect
  if (images[currentImageIndex]) {
    tint(255, fadeInAmount); // Apply fade-in effect
    image(images[currentImageIndex], 0, 0, canvasSize, canvasSize); // Display current image
  }
}

// Function to fetch and store generated images
async function generateImage() {
  // Disable the button immediately
  button.elt.disabled = true;

  const digit = select('#digitInput').value(); // Get the digit from input
  // Validate input
  if (digit < 0 || digit > 9) {
    showMessage("Invalid input. Please enter a digit between 0 and 9."); // Show message for invalid input
    button.elt.disabled = false; // Re-enable button for valid input
    return; // Exit the function
  }

  const remoteURL = `https://digit2image-backend.onrender.com/generate/${digit}`;
  const localURL = `http://localhost:8080/generate/${digit}`;

  try {
    const response = await fetch(remoteURL); // Try fetching from the remote server

    // Check if the response is not okay (status not in the range 200-299)
    if (!response.ok) {
      throw new Error(`Remote server responded with status ${response.status}`);
    }

    const data = await response.json(); // Parse the response as JSON

    // Check if new images are received
    if (data.images && data.images.length > 0) {
      console.log("New images received from remote server:", data.images.length);
      storeImages(data.images); // Store new images
      // Set the current image index to the first new image
      if (currentImageIndex === -1) {
        currentImageIndex = 0; // Start displaying the new images
        timer = 0; // Reset timer
        fadeOutAmount = 255; // Start fade from full visibility
        fadeInAmount = 0; // Start with the current image invisible
      }
    } else {
      console.error("No images returned for the specified digit from remote server.");
      // If no images, try local server
      await fetchFromLocalServer(localURL);
    }
  } catch (error) {
    console.error("Error fetching from remote server:", error.message);
    // If an error occurs, try local server
    await fetchFromLocalServer(localURL);
  }
}

// Helper function to fetch images from the local server
async function fetchFromLocalServer(localURL) {
  try {
    const response = await fetch(localURL); // Fetch from the local server

    // Check if the response is not okay
    if (!response.ok) {
      throw new Error(`Local server responded with status ${response.status}`);
    }

    const data = await response.json(); // Parse the response as JSON

    // Check if new images are received
    if (data.images && data.images.length > 0) {
      console.log("New images received from local server:", data.images.length);
      storeImages(data.images); // Store new images
      // Set the current image index to the first new image
      if (currentImageIndex === -1) {
        currentImageIndex = 0; // Start displaying the new images
        timer = 0; // Reset timer
        fadeOutAmount = 255; // Start fade from full visibility
        fadeInAmount = 0; // Start with the current image invisible
      }
    } else {
      console.error("No images returned for the specified digit from local server.");
    }
  } catch (error) {
    console.error("Error fetching from local server:", error.message);
    showMessage("Failed to fetch images from both servers."); // Notify the user
  } finally {
    button.elt.disabled = false; // Re-enable the button after trying both servers
  }
}

// Function to show the message box
function showMessage(message) {
  const messageBox = select('#messageBox');
  messageBox.html(message);
  messageBox.style('display', 'block'); // Show the message box

  // Hide the message box after 3 seconds
  setTimeout(() => {
    messageBox.style('display', 'none'); // Hide the message box
  }, 3000);
}

// Store images into the images array
function storeImages(newImages) {
  for (let imageData of newImages) {
    let img = createImage(gridSize, gridSize);
    img.loadPixels();

    // Fill img pixels with data
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const index = (x + y * gridSize) * 4;
        const value = imageData[y][x]; // Assuming imageData is a 2D array
        img.pixels[index + 0] = value; // Red
        img.pixels[index + 1] = value; // Green
        img.pixels[index + 2] = value; // Blue
        img.pixels[index + 3] = 255;     // Alpha
      }
    }

    img.updatePixels();
    images.push(img); // Add img to images array
  }
}
