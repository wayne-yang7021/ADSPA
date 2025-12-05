
// Default Result Video (Creative Commons)
export const MOCK_RESULT_VIDEO = "https://videos.pexels.com/video-files/3129957/3129957-uhd_2560_1440_25fps.mp4";

// Default Simulation Assets (Placeholders if user doesn't upload specific ones)
// Using generic tech/grid placeholders to look professional
export const DEFAULT_ASSETS = {
  // Phase 1
  spatialFrame: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1000&auto=format&fit=crop", // Landscape
  spatialAsset: "https://cdn-icons-png.flaticon.com/512/1160/1160358.png", // Simple product icon
  spatialBox: "https://placehold.co/600x400/000000/FFF/png?text=Optimal+Region", // Placeholder

  // Phase 2
  occlusionMask: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop", // Abstract depth map look
  occlusionResult: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop", // Abstract lighting
};

export const DEFAULT_PHASE_DURATIONS = {
  phase1: 3000,
  phase2: 3000,
  phase3: 4000,
};

export const PHASE_LABELS = {
  phase1: "Choosing the best spot to insert",
  phase2: "Detecting the occlusion situation",
  phase3: "Working on the diffusion process",
};
