import { animateVolumeChange } from './gsapAnimations';

// Function to create a visual volume control slider
export const createVolumeControl = (container, initialVolume = 50) => {
  // Create slider container and bar
  const slider = document.createElement('div');
  const volumeBar = document.createElement('div');
  const volumeValue = document.createElement('span');
  
  slider.classList.add('volume-slider');
  volumeBar.classList.add('volume-bar');
  volumeValue.classList.add('volume-value');
  
  volumeBar.style.width = `${initialVolume}%`;
  volumeValue.innerText = `${initialVolume}%`;

  slider.appendChild(volumeBar);
  slider.appendChild(volumeValue);
  container.appendChild(slider);

  // Event listener for changing volume (dragging)
  slider.addEventListener('click', (event) => {
    const sliderWidth = slider.offsetWidth;
    const newVolume = (event.offsetX / sliderWidth) * 100;
    
    // Update visual volume bar
    animateVolumeChange(volumeBar, newVolume);
    
    // Update the displayed value
    volumeValue.innerText = `${Math.round(newVolume)}%`;

    // Apply the new volume to the player (integration with your player)
    setVolume(newVolume);
  });

  return slider;
};

// Function to update the volume display visually when controlled by commands
export const updateVolumeVisual = (volumeBar, newValue) => {
  animateVolumeChange(volumeBar, newValue);
  const volumeValue = volumeBar.parentElement.querySelector('.volume-value');
  volumeValue.innerText = `${Math.round(newValue)}%`;
};

// CSS for visual volume control (you can include this in your main styles)
/*
.volume-slider {
  position: relative;
  width: 100%;
  height: 10px;
  background-color: #ddd;
  border-radius: 5px;
  cursor: pointer;
}

.volume-bar {
  height: 100%;
  background-color: #1db954;
  border-radius: 5px;
}

.volume-value {
  position: absolute;
  top: -20px;
  right: 0;
  font-size: 12px;
  color: #fff;
}
*/
