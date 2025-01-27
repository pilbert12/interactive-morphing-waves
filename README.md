# Interactive Morphing Waves

A mesmerizing 3D visualization that demonstrates complex wave patterns and shape morphing using Three.js. The animation smoothly transitions between three geometric forms: sphere, DNA helix, and toroid, while maintaining interactive wave patterns.

## Features

- Smooth morphing between three geometric shapes:
  - Sphere with wave patterns
  - Double helix DNA structure
  - Toroid (donut shape)
- Interactive ripple effects (click anywhere to create waves)
- Real-time mathematical visualization
- Customizable parameters for all shapes and effects
- Color transitions that follow the geometric transformations

## Live Demo

[Add your deployed demo link here]

## Setup

1. Clone the repository:
```bash
git clone [your-repo-url]
cd [repo-name]
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Controls

### Morphing
- Toggle "Auto Morph" to start/stop the shape transitions
- Adjust "Morph Speed" to control transition rate

### Interaction
- Click anywhere on the shape to create ripple effects
- Left-click and drag to rotate the view
- Right-click and drag to pan
- Scroll to zoom in/out

### Customization Panels
- **Wave Controls**: Adjust base wave patterns
- **Ripple Controls**: Modify ripple behavior
- **Helix Controls**: Customize DNA helix shape
- **Toroid Controls**: Adjust donut shape parameters
- **Visual Controls**: Change point size and opacity

## Math Visualization

The visualization panel shows real-time calculations for:
- Current point coordinates
- Morphing equations
- Wave functions
- Shape-specific parameters
- Active ripple effects

## Technologies Used

- Three.js for 3D rendering
- dat.gui for controls
- Vite for development and building

## License

MIT License - feel free to use and modify for your own projects! 