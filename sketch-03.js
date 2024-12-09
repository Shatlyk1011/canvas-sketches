const canvasSketch = require("canvas-sketch");

import { TKMGeoJson } from "./data";

const settings = {
  dimensions: [2048, 1024],
  animate: true, // Enable animation
};

const sketch = () => {
  const regionAdresses = [
    [58.4, 37.95], // Ashgabat
    [59, 42.05], // Dashoguz
    [61.8, 37.6], // Mary
    [63, 39], // Lebap
    [55, 40], // Balkan
  ];

  const [minLon, minLat, maxLon, maxLat] = TKMGeoJson.features[0].geometry.coordinates[0].reduce(
    ([minLon, minLat, maxLon, maxLat], [lon, lat]) => [
      Math.min(minLon, lon),
      Math.min(minLat, lat),
      Math.max(maxLon, lon),
      Math.max(maxLat, lat),
    ],
    [Infinity, Infinity, -Infinity, -Infinity]
  );

  let beamProgress = 0; // Beam's progress percentage (0 to 1)
  let currentSegment = 0; // Current address segment
  return ({ context, width, height }) => {
    // Clear canvas
    context.fillStyle = "white";
    context.fillRect(0, 0, width, height);

    const lonRange = maxLon - minLon;
    const latRange = maxLat - minLat;
    const scale = Math.min(width / lonRange, height / latRange);

    const offsetX = -minLon * scale + (width - lonRange * scale) / 2;
    const offsetY = maxLat * scale + (height - latRange * scale) / 2;

    const project = ([longitude, latitude]) => {
      const x = longitude * scale + offsetX;
      const y = -latitude * scale + offsetY;
      return [x, y];
    };

    // Draw borders
    context.strokeStyle = "black";
    context.lineWidth = 2;
    context.beginPath();
    TKMGeoJson.features.forEach((feature) => {
      const { coordinates } = feature.geometry;
      coordinates.forEach((ring) => {
        ring.forEach((point, index) => {
          const [x, y] = project(point);
          if (index === 0) {
            context.moveTo(x, y);
          } else {
            context.lineTo(x, y);
          }
        });
        context.closePath();
      });
    });
    context.stroke();

    // Draw user addresses
    regionAdresses.forEach(([lon, lat]) => {
      const [x, y] = project([lon, lat]);
      context.fillStyle = "green";
      context.beginPath();
      context.arc(x, y, 10, 0, Math.PI * 2);
      context.fill();
    });

    // Animate curved flight path
    const from = project(regionAdresses[currentSegment]);
    const to = project(regionAdresses[(currentSegment + 1) % regionAdresses.length]);

    // Calculate control point for parabolic curve
    const controlX = (from[0] + to[0]) / 2;
    const controlY = (from[1] + to[1]) / 2 - 100; // Height of the parabola

    // Draw the curve
    context.strokeStyle = "gray";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(from[0], from[1]);
    context.quadraticCurveTo(controlX, controlY, to[0], to[1]);
    context.stroke();

    // Draw the traveling plane
    const t = beamProgress;
    const x = (1 - t) * (1 - t) * from[0] + 2 * (1 - t) * t * controlX + t * t * to[0];
    const y = (1 - t) * (1 - t) * from[1] + 2 * (1 - t) * t * controlY + t * t * to[1];

    context.fillStyle = "orangered";
    context.beginPath();
    context.arc(x, y, 8, 0, Math.PI * 2); // Plane represented by a circle
    context.fill();

    // Update beam progress
    beamProgress += 0.01; // Adjust speed here
    if (beamProgress >= 1) {
      beamProgress = 0;
      currentSegment = (currentSegment + 1) % regionAdresses.length;
    }
  };
};

canvasSketch(sketch, settings);
