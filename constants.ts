
// This is where you put your "After" video URL.
// Since we cannot generate it in real-time in the browser without a backend,
// we mock the result. Replace this URL with your hosted video.
// For this demo, I am using a creative commons stock video as the "After".

export const MOCK_RESULT_VIDEO = "https://videos.pexels.com/video-files/3129957/3129957-uhd_2560_1440_25fps.mp4";

export const PROCESSING_PHASES = [
  {
    text: "Choosing the best spot to insert",
    duration: 2500 // 2.5 seconds
  },
  {
    text: "Detecting the occlusion situation",
    duration: 3000 // 3 seconds
  },
  {
    text: "Working on the diffusion process",
    duration: 4500 // 4.5 seconds
  }
];
