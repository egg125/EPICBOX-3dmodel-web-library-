// components/ModelViewer3D.js
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

/**
 * Componente que renderiza un modelo 3D
 * @param {Object} props - Propiedades del componente
 * @param {string} props.modelUrl - URL del modelo 3D a través del proxy
 * @param {string} props.fileType - Tipo de archivo (gltf, obj, fbx)
 * @param {string} props.backgroundColor - Color de fondo (opcional)
 * @param {number} props.width - Ancho del visor (opcional)
 * @param {number} props.height - Alto del visor (opcional)
 */
const ModelViewer3D = ({ 
  modelUrl, 
  fileType, 
  backgroundColor = '#f5f5f5',
  width = 600,
  height = 400
}) => {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const modelRef = useRef(null);

  useEffect(() => {
    // Inicialización de Three.js
    const initThree = () => {
      // Crear escena
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(backgroundColor);
      sceneRef.current = scene;

      // Crear cámara
      const camera = new THREE.PerspectiveCamera(
        75, 
        width / height, 
        0.1, 
        1000
      );
      camera.position.z = 5;
      cameraRef.current = camera;

      // Crear renderizador
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      rendererRef.current = renderer;

      // Añadir el canvas al DOM
      mountRef.current.appendChild(renderer.domElement);

      // Controles de órbita para rotar el modelo
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.25;
      controlsRef.current = controls;

      // Iluminación
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);
      
      const dirLight = new THREE.DirectionalLight(0xffffff, 1);
      dirLight.position.set(1, 1, 1);
      scene.add(dirLight);

      // Agregar cuadrícula para referencia
      const gridHelper = new THREE.GridHelper(10, 10);
      scene.add(gridHelper);

      // Función de animación
      const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      
      animate();
    };

    // Función para cargar el modelo
    const loadModel = () => {
      if (!modelUrl) return;
      
      // Eliminar modelo anterior si existe
      if (modelRef.current) {
        sceneRef.current.remove(modelRef.current);
      }

      // Seleccionar el cargador adecuado según el tipo de archivo
      switch (fileType.toLowerCase()) {
        case 'gltf':
        case 'glb':
          loadGLTF();
          break;
        case 'obj':
          loadOBJ();
          break;
        case 'fbx':
          loadFBX();
          break;
        default:
          console.error('Tipo de archivo no soportado:', fileType);
      }
    };

    // Funciones específicas para cada formato
    const loadGLTF = () => {
      const loader = new GLTFLoader();
      loader.load(
        modelUrl,
        (gltf) => {
          const model = gltf.scene;
          
          // Centrar y escalar el modelo
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          
          model.position.x = -center.x;
          model.position.y = -center.y;
          model.position.z = -center.z;
          
          const maxDim = Math.max(size.x, size.y, size.z);
          if (maxDim > 0) {
            model.scale.multiplyScalar(2.0 / maxDim);
          }
          
          sceneRef.current.add(model);
          modelRef.current = model;
        },
        (xhr) => {
          console.log((xhr.loaded / xhr.total) * 100 + '% cargado');
        },
        (error) => {
          console.error('Error cargando GLTF:', error);
        }
      );
    };

    const loadOBJ = () => {
      const loader = new OBJLoader();
      loader.load(
        modelUrl,
        (obj) => {
          // Centrar y escalar el modelo
          const box = new THREE.Box3().setFromObject(obj);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          
          obj.position.x = -center.x;
          obj.position.y = -center.y;
          obj.position.z = -center.z;
          
          const maxDim = Math.max(size.x, size.y, size.z);
          if (maxDim > 0) {
            obj.scale.multiplyScalar(2.0 / maxDim);
          }
          
          // Aplicar material básico si no tiene material
          obj.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              if (!child.material) {
                child.material = new THREE.MeshStandardMaterial({
                  color: 0xcccccc,
                  roughness: 0.8,
                  metalness: 0.2
                });
              }
            }
          });
          
          sceneRef.current.add(obj);
          modelRef.current = obj;
        },
        (xhr) => {
          console.log((xhr.loaded / xhr.total) * 100 + '% cargado');
        },
        (error) => {
          console.error('Error cargando OBJ:', error);
        }
      );
    };

    const loadFBX = () => {
      const loader = new FBXLoader();
      loader.load(
        modelUrl,
        (fbx) => {
          // Centrar y escalar el modelo
          const box = new THREE.Box3().setFromObject(fbx);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          
          fbx.position.x = -center.x;
          fbx.position.y = -center.y;
          fbx.position.z = -center.z;
          
          const maxDim = Math.max(size.x, size.y, size.z);
          if (maxDim > 0) {
            fbx.scale.multiplyScalar(2.0 / maxDim);
          }
          
          sceneRef.current.add(fbx);
          modelRef.current = fbx;
        },
        (xhr) => {
          console.log((xhr.loaded / xhr.total) * 100 + '% cargado');
        },
        (error) => {
          console.error('Error cargando FBX:', error);
        }
      );
    };

    // Iniciar Three.js
    initThree();
    
    // Cargar modelo
    loadModel();

    // Cleanup
    return () => {
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [modelUrl, fileType, backgroundColor, width, height]);

  return (
    <div className="model-viewer-container">
      <div 
        ref={mountRef} 
        className="model-viewer"
        style={{ width: `${width}px`, height: `${height}px` }}
      />
    </div>
  );
};

export default ModelViewer3D;