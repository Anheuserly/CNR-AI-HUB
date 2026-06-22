import { gsap } from 'gsap';

// Function to animate the now-playing card when a new track is played
export const animateNowPlaying = (element) => {
  gsap.fromTo(
    element,
    { opacity: 0, y: -30 },
    { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }
  );
};

// Function to animate volume slider changes
export const animateVolumeChange = (element, newValue) => {
  gsap.to(element, {
    width: `${newValue}%`,
    duration: 0.5,
    ease: 'power2.out',
  });
};

// Function to create full screen visual effect for the player
export const animateFullScreenPlayer = (element) => {
  gsap.fromTo(
    element,
    { scale: 0.8, opacity: 0 },
    { scale: 1, opacity: 1, duration: 1.2, ease: 'power3.inOut' }
  );
};

// Function to animate buttons when clicked (e.g., play/pause/skip)
export const animateButtonClick = (button) => {
  gsap.fromTo(
    button,
    { scale: 1 },
    { scale: 1.2, duration: 0.2, ease: 'back.out(1.7)', yoyo: true, repeat: 1 }
  );
};

// Function to create transition effect for switching between tracks
export const animateTrackSwitch = (oldTrack, newTrack) => {
  gsap.timeline()
    .to(oldTrack, { opacity: 0, duration: 0.5, ease: 'power1.inOut' })
    .fromTo(newTrack, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power1.inOut' });
};
