const canvasSketch = require("canvas-sketch");

const settings = {
  dimensions: [2048, 1024],
  animate: true, // Enable animation
};

const sketch = () => {
  const geoJsonData = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        id: "TKM",
        properties: { name: "Turkmenistan" },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [61.210817, 35.650072],
              [61.123071, 36.491597],
              [60.377638, 36.527383],
              [59.234762, 37.412988],
              [58.436154, 37.522309],
              [57.330434, 38.029229],
              [56.619366, 38.121394],
              [56.180375, 37.935127],
              [55.511578, 37.964117],
              [54.800304, 37.392421],
              [53.921598, 37.198918],
              [53.735511, 37.906136],
              [53.880929, 38.952093],
              [53.101028, 39.290574],
              [53.357808, 39.975286],
              [52.693973, 40.033629],
              [52.915251, 40.876523],
              [53.858139, 40.631034],
              [54.736845, 40.951015],
              [54.008311, 41.551211],
              [53.721713, 42.123191],
              [52.91675, 41.868117],
              [52.814689, 41.135371],
              [52.50246, 41.783316],
              [52.944293, 42.116034],
              [54.079418, 42.324109],
              [54.755345, 42.043971],
              [55.455251, 41.259859],
              [55.968191, 41.308642],
              [57.096391, 41.32231],
              [56.932215, 41.826026],
              [57.78653, 42.170553],
              [58.629011, 42.751551],
              [59.976422, 42.223082],
              [60.083341, 41.425146],
              [60.465953, 41.220327],
              [61.547179, 41.26637],
              [61.882714, 41.084857],
              [62.37426, 40.053886],
              [63.518015, 39.363257],
              [64.170223, 38.892407],
              [65.215999, 38.402695],
              [66.54615, 37.974685],
              [66.518607, 37.362784],
              [66.217385, 37.39379],
              [65.745631, 37.661164],
              [65.588948, 37.305217],
              [64.746105, 37.111818],
              [64.546479, 36.312073],
              [63.982896, 36.007957],
              [63.193538, 35.857166],
              [62.984662, 35.404041],
              [62.230651, 35.270664],
              [61.210817, 35.650072],
            ],
          ],
        },
      },
    ],
  };
  const userAddresses = [
    [58.4, 37.95], // Ashgabat
    [59, 42.05], // Dashoguz
    [61.8, 37.6], // Mary
    [63, 39], // Lebap
    [55, 40], // Balkan
  ];

  const [minLon, minLat, maxLon, maxLat] = geoJsonData.features[0].geometry.coordinates[0].reduce(
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
    geoJsonData.features.forEach((feature) => {
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
    userAddresses.forEach(([lon, lat]) => {
      const [x, y] = project([lon, lat]);
      context.fillStyle = "red";
      context.beginPath();
      context.arc(x, y, 5, 0, Math.PI * 2);
      context.fill();
    });

    // Animate curved flight path
    const from = project(userAddresses[currentSegment]);
    const to = project(userAddresses[(currentSegment + 1) % userAddresses.length]);

    // Calculate control point for parabolic curve
    const controlX = (from[0] + to[0]) / 2;
    const controlY = (from[1] + to[1]) / 2 - 100; // Height of the parabola

    // Draw the curve
    context.strokeStyle = "blue";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(from[0], from[1]);
    context.quadraticCurveTo(controlX, controlY, to[0], to[1]);
    context.stroke();

    // Draw the traveling plane
    const t = beamProgress;
    const x = (1 - t) * (1 - t) * from[0] + 2 * (1 - t) * t * controlX + t * t * to[0];
    const y = (1 - t) * (1 - t) * from[1] + 2 * (1 - t) * t * controlY + t * t * to[1];

    context.fillStyle = "green";
    context.beginPath();
    context.arc(x, y, 8, 0, Math.PI * 2); // Plane represented by a circle
    context.fill();

    // Update beam progress
    beamProgress += 0.01; // Adjust speed here
    if (beamProgress >= 1) {
      beamProgress = 0;
      currentSegment = (currentSegment + 1) % userAddresses.length;
    }
  };
};

canvasSketch(sketch, settings);
