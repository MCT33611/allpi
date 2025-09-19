# **App Name**: AllPI Gallery

## Core Features:

- Image Fetcher: Fetch images and folder structure from the specified GitHub repository (https://github.com/MCT33611/allpi.git) on build.
- Dynamic Layout Engine: Render the images in a gallery, using a dynamic layout strategy incorporating both horizontal and vertical scrolling according to content. Tool that assesses an image location, extension, folder and dimensions.
- Scroll Direction Toggle: Allow users to switch between horizontal and vertical scrolling using intuitive icon toggles.
- Last Visited Image Persistence: Use localStorage to save and restore the ID of the last viewed image, so users can pick up where they left off.
- Endless Scroll: Continuously load and display images as the user scrolls.

## Style Guidelines:

- Background color: Dark gray (#222222) for a minimalistic dark theme.
- Primary color: Off-white (#F5F5F5) for text and general UI elements.
- Accent color: Yellow (#FFDA63) for borders, highlights, and interactive elements.
- Font: 'Inter', a grotesque-style sans-serif for a modern look. Suitable for both headlines and body text.
- Use custom icons for the scrolling direction toggle. Icons should be simple, modern, and related to the action.
- A minimalist layout with images arranged in a flexible grid, adapting to both horizontal and vertical scrolling. Images should take up most of the screen space, with minimal borders or margins.
- Subtle animations for image transitions, hover effects, and scrolling direction changes to enhance the user experience without being intrusive.