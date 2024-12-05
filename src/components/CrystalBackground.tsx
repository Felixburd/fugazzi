'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const CrystalBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Check if it's a mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    function setupScene() {
      // Scene setup
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);

      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.set(0, 0, 100);

      const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio
      containerRef.current?.appendChild(renderer.domElement);

      // Ground plane
      const groundGeometry = new THREE.PlaneGeometry(200, 200);
      const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -20;
      scene.add(ground);

      // Crystal group
      const group = new THREE.Group();
      scene.add(group);

      // Cube render target with reduced size for performance
      const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(128, {
        format: THREE.RGBAFormat,
        generateMipmaps: true,
        minFilter: THREE.LinearMipmapLinearFilter,
      });

      const cubeCamera = new THREE.CubeCamera(1, 1, cubeRenderTarget);
      cubeCamera.position.set(0, 120, 0);
      scene.add(cubeCamera);

      // Create crystal facets (reduced number for performance)
      for (let i = 0; i < 30; i++) {
        const geometry = new THREE.BoxGeometry(
          Math.random() * 80 + 5,
          Math.random() * 80 + 5,
          Math.random() * 5 + 1
        );
        const material = new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          metalness: 0.9,
          roughness: 0.1,
          transmission: 0.9,
          thickness: 0.5,
          side: THREE.DoubleSide,
          envMap: cubeRenderTarget.texture,
          envMapIntensity: 0.8,
        });
        const plane = new THREE.Mesh(geometry, material);
        plane.position.set(
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100
        );
        plane.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        group.add(plane);
      }

      // Reduced number of lights for performance
      // Add lights
      for (let i = 0; i < 10; i++) {
        const intensity = Math.random() * 40 + 40;
        const color = new THREE.Color(Math.random(), Math.random(), Math.random());
        const pointLight = new THREE.PointLight(color, intensity, 200);
        pointLight.position.set(
          (Math.random() - 0.5) * 200,
          (Math.random() - 0.5) * 200,
          (Math.random() - 0.5) * 200
        );
        scene.add(pointLight);
      }

      // Rotation variables
      let rotationX = 0;
      let rotationY = 0;
      let targetRotationX = 0;
      let targetRotationY = 0;
      let time = 0;
      let handleMouseMove: ((event: MouseEvent) => void) | null = null;

      // Setup mouse movement for desktop only
      if (!isMobile) {
        handleMouseMove = (event: MouseEvent) => {
          // Convert mouse position to rotation with reduced multiplier for subtlety
          targetRotationX = (event.clientY / window.innerHeight - 0.5) * Math.PI * 0.15;
          targetRotationY = (event.clientX / window.innerWidth - 0.5) * Math.PI * 0.15;
        };
        window.addEventListener('mousemove', handleMouseMove);
      }

      // Animation variables
      let lastTime = 0;
      
      // Animation with delta time
      function animate(currentTime: number) {
        requestAnimationFrame(animate);

        // Calculate delta time for smooth animation
        const deltaTime = (currentTime - lastTime) * 0.001;
        lastTime = currentTime;
        time += deltaTime * 0.2; // Slower time progression

        if (!isMobile) {
          rotationX += (targetRotationX - rotationX) * 0.01; // Reduced from 0.02
          rotationY += (targetRotationY - rotationY) * 0.01;
          group.rotation.x = rotationX + Math.sin(time * 0.5) * 0.03;
          group.rotation.y = rotationY + time * 0.05;
        } else {
          group.rotation.x = Math.sin(time * 0.5) * 0.05;
          group.rotation.y = time * 0.05;
          group.rotation.z = Math.cos(time * 0.4) * 0.03;
        }

        // Update environment map less frequently
        if (Math.floor(time * 2) % 2 === 0) {
          group.visible = false;
          cubeCamera.update(renderer, scene);
          group.visible = true;
        }

        renderer.render(scene, camera);
      }
      animate(0);

      // Handle resize
      function handleResize() {
        if (!containerRef.current) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
      window.addEventListener('resize', handleResize);

      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
        if (!isMobile && handleMouseMove) {
          window.removeEventListener('mousemove', handleMouseMove);
        }
        containerRef.current?.removeChild(renderer.domElement);
        renderer.dispose();
      };
    }

    setupScene();
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
      }}
    />
  );
};

export default CrystalBackground; 