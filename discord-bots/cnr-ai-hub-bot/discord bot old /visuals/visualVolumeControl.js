import { animateNowPlaying, animateTrackSwitch } from './gsapAnimations';

// Function to create a "Now Playing" visual card for the current track
export const createNowPlayingCard = (container, track) => {
  // Create card elements
  const nowPlayingCard = document.createElement('div');
  const albumArt = document.createElement('img');
  const trackInfo = document.createElement('div');
  const trackTitle = document.createElement('h3');
  const trackArtist = document.createElement('p');
  
  nowPlayingCard.classList.add('now-playing-card');
  albumArt.src = track.albumArt;
  trackTitle.innerText = track.title;
  trackArtist.innerText = track.artist;

  trackInfo.appendChild(trackTitle);
  trackInfo.appendChild(trackArtist);
  nowPlayingCard.appendChild(albumArt);
  nowPlayingCard.appendChild(trackInfo);

  // Add to the container
  container.innerHTML = ''; // Clear previous track
  container.appendChild(nowPlayingCard);

  // Animate the card
  animateNowPlaying(nowPlayingCard);
  
  return nowPlayingCard;
};

// Function to update the "Now Playing" card when the track switches
export const updateNowPlayingCard = (container, oldTrackCard, newTrack) => {
  const newTrackCard = createNowPlayingCard(container, newTrack);
  animateTrackSwitch(oldTrackCard, newTrackCard);
};

// CSS for the now-playing card (you can include this in your main styles)
/*
.now-playing-card {
  display: flex;
  align-items: center;
  background-color: #333;
  padding: 10px;
  border-radius: 10px;
  color: white;
}

.now-playing-card img {
  width: 60px;
  height: 60px;
  border-radius: 5px;
  margin-right: 10px;
}

.now-playing-card h3 {
  margin: 0;
  font-size: 18px;
}

.now-playing-card p {
  margin: 0;
  font-size: 14px;
  color: #ccc;
}
*/
