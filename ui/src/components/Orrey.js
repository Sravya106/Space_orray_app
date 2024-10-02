import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import axios from 'axios';
import { GUI } from 'dat.gui';
import { Canvas, useFrame } from '@react-three/fiber';
import { VRButton } from 'three/examples/jsm/webxr/VRButton';

const Orrery = () => {
  const mountRef = useRef(null);
  const [selectedObject, setSelectedObject] = useState(null);
  const [showLabels, setShowLabels] = useState(true);
  const [showTrajectories, setShowTrajectories] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [limitNEOs, setLimitNEOs] = useState(10);
  const fireballs = useRef([]);
  const smallBodies = useRef([]);

  useEffect(() => {
    let scene, camera, renderer, controls, sun, raycaster, mouse;
    let celestialObjects = [];
    const fontLoader = new FontLoader();

    // Initialize the scene, camera, and renderer
    const init = () => {
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      renderer = new THREE.WebGLRenderer();
      renderer.setSize(window.innerWidth, window.innerHeight);
      mountRef.current.appendChild(renderer.domElement);

      // Create Sun
      const sunGeometry = new THREE.SphereGeometry(0.5, 32, 32);
      const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
      sun = new THREE.Mesh(sunGeometry, sunMaterial);
      scene.add(sun);

      // Controls
      controls = new OrbitControls(camera, renderer.domElement);
      camera.position.z = 10;

      // Raycaster for clicking
      raycaster = new THREE.Raycaster();
      mouse = new THREE.Vector2();

      // Add VR support
      document.body.appendChild(VRButton.createButton(renderer));

      // Load celestial bodies
      fetchFireballs();
      fetchSmallBodies();

      // Add GUI controls
      const gui = new GUI();
      gui.add(this, 'showLabels').name('Show Labels');
      gui.add(this, 'showTrajectories').name('Show Trajectories');
      gui.add(this, 'speed', 0, 10).name('Speed Control');
      gui.add(this, 'limitNEOs', 0, 50).name('Limit NEOs/NECs/PHAs');
    };

    // Fetch Fireballs
    const fetchFireballs = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/fireball');
        const fireballData = response.data.data;
        addFireballsToScene(fireballData);
      } catch (error) {
        console.error('Error fetching fireballs:', error);
      }
    };

    // Fetch Small Bodies
    const fetchSmallBodies = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/sbdb');
        const sbdbData = response.data;
        addSmallBodiesToScene(sbdbData);
      } catch (error) {
        console.error('Error fetching small body data:', error);
      }
    };

    // Add fireballs to the scene
    const addFireballsToScene = (data) => {
      data.forEach((fireball, index) => {
        if (index >= limitNEOs) return;
        const fireballGeometry = new THREE.SphereGeometry(0.02, 16, 16);
        const fireballMaterial = new THREE.MeshBasicMaterial({ color: 0xff4500 });
        const fireballMesh = new THREE.Mesh(fireballGeometry, fireballMaterial);
        
        const radius = Math.random() * 3 + 2;
        const speed = 0.01 + Math.random() * 0.02;

        fireballs.current.push({
          mesh: fireballMesh,
          radius,
          speed,
          angle: Math.random() * Math.PI * 2,
          info: fireball,
        });

        celestialObjects.push(fireballMesh);
        scene.add(fireballMesh);

        if (showLabels) {
          addLabel(fireballMesh, fireball.name);
        }
      });
    };

    // Add small bodies to the scene
    const addSmallBodiesToScene = (data) => {
      data.forEach((smallBody, index) => {
        if (index >= limitNEOs) return;
        const asteroidGeometry = new THREE.SphereGeometry(0.05, 32, 32);
        const asteroidMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 });
        const asteroidMesh = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
        
        const radius = Math.random() * 4 + 2;
        const speed = 0.005 + Math.random() * 0.01;

        smallBodies.current.push({
          mesh: asteroidMesh,
          radius,
          speed,
          angle: Math.random() * Math.PI * 2,
          info: smallBody,
        });

        celestialObjects.push(asteroidMesh);
        scene.add(asteroidMesh);

        if (showLabels) {
          addLabel(asteroidMesh, smallBody.name);
        }
      });
    };

    // Add a label to a celestial body
    const addLabel = (mesh, name) => {
      const loader = new FontLoader();
      loader.load('/path/to/font.json', (font) => {
        const textGeometry = new TextGeometry(name, {
          font: font,
          size: 0.1,
          height: 0.01,
        });
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.set(mesh.position.x, mesh.position.y + 0.1, mesh.position.z);
        scene.add(textMesh);
      });
    };

    // Animate the orrery
    const animate = () => {
      requestAnimationFrame(animate);

      fireballs.current.forEach(fireball => {
        fireball.angle += fireball.speed * speed;
        fireball.mesh.position.x = fireball.radius * Math.cos(fireball.angle);
        fireball.mesh.position.z = fireball.radius * Math.sin(fireball.angle);
      });

      smallBodies.current.forEach(smallBody => {
        smallBody.angle += smallBody.speed * speed;
        smallBody.mesh.position.x = smallBody.radius * Math.cos(smallBody.angle);
        smallBody.mesh.position.z = smallBody.radius * Math.sin(smallBody.angle);
      });

      renderer.render(scene, camera);
    };

    init();
    animate();

    return () => {
      mountRef.current.removeChild(renderer.domElement);
    };
  }, [showLabels, showTrajectories, speed, limitNEOs]);

  return (
    <div>
      <div ref={mountRef}></div>
      {selectedObject && (
        <div className="info-panel">
          <h2>Selected Object Information</h2>
          <pre>{JSON.stringify(selectedObject, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default Orrery;
