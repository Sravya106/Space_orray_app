import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const SolarSystem = () => {
    const sceneRef = useRef();
    const [selectedPlanet, setSelectedPlanet] = useState(null);
    const [tooltip, setTooltip] = useState(null);

    useEffect(() => {
        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        sceneRef.current.appendChild(renderer.domElement);

        // OrbitControls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;
        controls.screenSpacePanning = false;

        // Create a sun
        const sunGeometry = new THREE.SphereGeometry(1, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        scene.add(sun);

        // Distances in AU (1 AU = distance from Earth to Sun)
        const AU = 4; // Scaling factor for visualization
        const planetData = [
            { radius: 0.2, distance: 0.39 * AU, color: 0x8B4513, name: 'Mercury', speed: 0.24 },
            { radius: 0.4, distance: 0.72 * AU, color: 0xffcc00, name: 'Venus', speed: 0.615 },
            { radius: 0.5, distance: 1.00 * AU, color: 0x0000ff, name: 'Earth', speed: 1 },
            { radius: 0.4, distance: 1.52 * AU, color: 0xff4500, name: 'Mars', speed: 0.524 },
            { radius: 0.6, distance: 5.20 * AU, color: 0x00ff00, name: 'Jupiter', speed: 0.083 },
            { radius: 0.5, distance: 9.54 * AU, color: 0xffd700, name: 'Saturn', speed: 0.034 },
            { radius: 0.4, distance: 19.22 * AU, color: 0x00ffff, name: 'Uranus', speed: 0.012 },
            { radius: 0.4, distance: 30.06 * AU, color: 0x0000ff, name: 'Neptune', speed: 0.0068 },
        ];

        const planets = [];
        planetData.forEach(({ radius, distance, color, name }) => {
            const geometry = new THREE.SphereGeometry(radius, 32, 32);
            const material = new THREE.MeshBasicMaterial({ color });
            const planet = new THREE.Mesh(geometry, material);
            planet.position.x = distance;
            planet.userData = { name, angle: Math.random() * Math.PI * 2 }; // Store initial angle for orbit
            planets.push(planet);
            scene.add(planet);

            // Create orbit for the planet
            const orbitGeometry = new THREE.CircleGeometry(distance, 64);
            const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.5 });
            const orbit = new THREE.LineLoop(orbitGeometry, orbitMaterial);
            orbit.rotation.x = Math.PI / 2; // Rotate to lay flat on the XY plane
            scene.add(orbit);
        });

        // Create moons for Earth and Mars
        const moonData = [
            { planetIndex: 2, radius: 0.1, distance: 0.6 * AU, color: 0xaaaaaa }, // Moon for Earth
            { planetIndex: 3, radius: 0.1, distance: 0.8 * AU, color: 0xaaaaaa }, // Moon for Mars
        ];

        moonData.forEach(({ planetIndex, radius, distance, color }) => {
            const geometry = new THREE.SphereGeometry(radius, 32, 32);
            const material = new THREE.MeshBasicMaterial({ color });
            const moon = new THREE.Mesh(geometry, material);
            const planet = planets[planetIndex];
            moon.position.x = planet.position.x + distance;
            moon.position.y = 0;
            scene.add(moon);
        });

        // Camera position
        camera.position.z = 15;

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            planets.forEach((planet, index) => {
                // Rotate the planet on its own axis
                planet.rotation.y += 0.01;

                // Update the position to simulate orbital motion
                planet.userData.angle += planetData[index].speed * 0.01; // Increase the angle based on the planet's speed
                planet.position.x = planetData[index].distance * Math.cos(planet.userData.angle);
                planet.position.z = planetData[index].distance * Math.sin(planet.userData.angle);
            });
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        // Add raycaster for interactivity
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        // Handle mouse click event
        const handleMouseClick = (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(planets);
            if (intersects.length > 0) {
                const planet = intersects[0].object;
                setSelectedPlanet(planet.userData.name);
                setTooltip({
                    name: planet.userData.name,
                    distance: (planet.position.x / AU).toFixed(2) + ' AU',
                });
                planets.forEach(p => p.material.color.set(p.userData.name === planet.userData.name ? 0xff0000 : p.userData.color));
            } else {
                setTooltip(null);
            }
        };

        window.addEventListener('click', handleMouseClick, false);

        // Clean up on component unmount
        return () => {
            sceneRef.current.removeChild(renderer.domElement);
            renderer.dispose();
            window.removeEventListener('click', handleMouseClick);
        };
    }, []);

    return (
        <div ref={sceneRef} style={{ width: '100%', height: '100vh' }}>
            {tooltip && (
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    background: 'rgba(255, 255, 255, 0.8)',
                    padding: '10px',
                    borderRadius: '5px',
                    boxShadow: '0 0 5px rgba(0, 0, 0, 0.3)',
                }}>
                    <h3>{tooltip.name}</h3>
                    <p>Distance from Sun: {tooltip.distance}</p>
                </div>
            )}
            {selectedPlanet && (
                <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    background: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    padding: '10px',
                    borderRadius: '5px',
                }}>
                    <p>Selected Planet: {selectedPlanet}</p>
                </div>
            )}
        </div>
    );
};

export default SolarSystem;
