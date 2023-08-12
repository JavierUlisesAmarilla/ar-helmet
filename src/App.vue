<script setup>

import { onMounted } from 'vue'
import { TresCanvas } from '@tresjs/core'
import { OrbitControls, useTweakPane, Environment } from '@tresjs/cientos'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'


// some global
let THREECAMERA = null
const { pane } = useTweakPane()


// callback: launched if a face is detected or lost
function detect_callback(isDetected) {
  if (isDetected) {
    console.log('INFO in detect_callback(): DETECTED')
  } else {
    console.log('INFO in detect_callback(): LOST')
  }
}


// build the 3D. called once when Jeeliz Face Filter is OK:
function init_threeScene(spec) {
  // CREATE THE HELMET MESH AND ADD IT TO THE SCENE:
  const threeStuffs = JeelizThreeHelper.init(spec, detect_callback)
  const HELMETOBJ3D = new THREE.Object3D()
  // let faceMesh = null
  let helmetGltf = null

  const loadingManager = new THREE.LoadingManager()
  const gltfLoader = new GLTFLoader(loadingManager)
  const maskLoader = new THREE.BufferGeometryLoader(loadingManager)
  const textureLoader = new THREE.TextureLoader()

  // LOAD HELMET MODEL
  gltfLoader.load(
    // 'models/helmet/helmet.glb',
    'models/helmet/Helmet_Knight.gltf',

    function (gltf) {
      // gltf.scene.scale.set(8, 8, 8)
      // gltf.scene.rotation.y = -Math.PI * 0.6
      // gltf.scene.position.set(0, 0.5, -0.11)

      gltf.scene.scale.set(7.5, 8, 7.5)
      gltf.scene.rotation.y = -Math.PI * 0.5
      gltf.scene.position.set(0, 0.2, -0.17)

      helmetGltf = gltf
    }
  )

  // // CREATE THE MASK
  // /*
  //   faceLowPolyEyesEarsFill.json has been exported from dev/faceLowPolyEyesEarsFill.blend
  //   using THREE.JS blender exporter with Blender v2.76
  // */
  // maskLoader.load('./models/face/faceLowPolyEyesEarsFill2.json', function (maskBufferGeometry) {
  //   const vertexShaderSource = 'uniform mat2 videoTransformMat2;\n\
  //   varying vec2 vUVvideo;\n\
  //   varying float vY, vNormalDotZ;\n\
  //   const float THETAHEAD = 0.25;\n\
  //   void main() {;\n\
  //     vec4 mvPosition = modelViewMatrix * vec4( position, 1.0);\n\
  //     vec4 projectedPosition = projectionMatrix * mvPosition;\n\
  //     gl_Position = projectedPosition;\n\
  //     ;\n\
  //     // compute UV coordinates on the video texture:;\n\
  //     vec4 mvPosition0 = modelViewMatrix * vec4( position, 1.0 );\n\
  //     vec4 projectedPosition0 = projectionMatrix * mvPosition0;\n\
  //     vUVvideo = vec2(0.5,0.5) + videoTransformMat2 * projectedPosition0.xy/projectedPosition0.w;\n\
  //     vY = position.y*cos(THETAHEAD)-position.z*sin(THETAHEAD);\n\
  //     vec3 normalView = vec3(modelViewMatrix * vec4(normal,0.));\n\
  //     vNormalDotZ = pow(abs(normalView.z), 1.5);\n\
  //   }'

  //   const fragmentShaderSource = "precision lowp float;\n\
  //   uniform sampler2D samplerVideo;\n\
  //   varying vec2 vUVvideo;\n\
  //   varying float vY, vNormalDotZ;\n\
  //   void main() {;\n\
  //     vec3 videoColor = texture2D(samplerVideo, vUVvideo).rgb;\n\
  //     float darkenCoeff = smoothstep(-0.15, 0.05, vY);\n\
  //     float borderCoeff = smoothstep(0.0, 0.55, vNormalDotZ);\n\
  //     gl_FragColor = vec4(videoColor * (1.-darkenCoeff), borderCoeff );\n\
  //   }"

  //   const mat = new THREE.ShaderMaterial({
  //     vertexShader: vertexShaderSource,
  //     fragmentShader: fragmentShaderSource,
  //     transparent: true,
  //     flatShading: false,
  //     uniforms: {
  //       samplerVideo: { value: JeelizThreeHelper.get_threeVideoTexture() },
  //       videoTransformMat2: { value: spec.videoTransformMat2 }
  //     },
  //     transparent: true
  //   })
  //   maskBufferGeometry.computeVertexNormals()
  //   faceMesh = new THREE.Mesh(maskBufferGeometry, mat)
  //   faceMesh.renderOrder = -10000
  //   faceMesh.frustumCulled = false
  //   faceMesh.scale.multiplyScalar(1.12)
  //   faceMesh.position.set(0, 0.3, -0.25)
  // })

  loadingManager.onLoad = () => {
    threeStuffs.faceObject.add(HELMETOBJ3D)
    // HELMETOBJ3D.add(faceMesh)
    HELMETOBJ3D.add(helmetGltf.scene)

    helmetGltf.scene.traverse((child) => {
      if (child.isMesh) {
        const folder = pane.addFolder({
          title: child.name
        })
        const params = {
          color: new THREE.Color(
            child.material.color.r * 255,
            child.material.color.g * 255,
            child.material.color.b * 255,
          )
        }
        folder.addInput(params, 'color').on('change', (e) => {
          child.material.color.setRGB(e.value.r / 255, e.value.g / 255, e.value.b / 255)
        })

        if (child.material.map) {
          folder.addBlade({
            view: 'list',
            label: 'texture',
            options: [
              { text: 'None', value: '' },
              { text: 'Eagle', value: 'images/logo1.png' },
              { text: 'Mark', value: 'images/logo2.png' },
            ],
            value: '',
          }).on('change', (e) => {
            if (e.value) {
              textureLoader.load(e.value, (texture) => {
                child.material.map = texture
              })
            } else {
              child.material.map = null
            }
          })
        }
      }
    })
  }

  // CREATE THE VIDEO BACKGROUND
  function create_mat2d(threeTexture, isTransparent) {
    return new THREE.RawShaderMaterial({
      depthWrite: false,
      depthTest: false,
      transparent: isTransparent,
      vertexShader: "attribute vec2 position;\n\
        varying vec2 vUV;\n\
        void main(void){;\n\
          gl_Position = vec4(position, 0., 1.);\n\
          vUV = 0.5+0.5*position;\n\
        }",
      fragmentShader: "precision lowp float;\n\
        uniform sampler2D samplerVideo;\n\
        varying vec2 vUV;\n\
        void main(void){;\n\
          gl_FragColor = texture2D(samplerVideo, vUV);\n\
        }",
      uniforms: {
        samplerVideo: { value: threeTexture }
      }
    })
  }

  // MT216: create the frame. We reuse the geometry of the video
  const calqueMesh = new THREE.Mesh(threeStuffs.videoMesh.geometry, create_mat2d(new THREE.TextureLoader().load('./images/frame_rupy.png'), true))
  calqueMesh.renderOrder = 999 // render last
  calqueMesh.frustumCulled = false
  threeStuffs.scene.add(calqueMesh)

  // CREATE THE CAMERA:
  THREECAMERA = JeelizThreeHelper.create_camera()

  // CREATE THE LIGHTS:
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
  dirLight.position.set(1, 0, 1)
  threeStuffs.scene.add(dirLight)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
  ambientLight.position.set(1, 0, 1)
  threeStuffs.scene.add(ambientLight)

  const spotLight = new THREE.SpotLight(0xffffff, 0.25)
  spotLight.position.set(1, 0, 1)
  threeStuffs.scene.add(spotLight)
}


function init_faceFilter(videoSettings) {
  JEELIZFACEFILTER.init({
    canvasId: 'jeeFaceFilterCanvas',
    NNCPath: './neuralNets/', // root of NN_DEFAULT.json file
    videoSettings: videoSettings,
    callbackReady: function (errCode, spec) {
      if (errCode) {
        console.log('AN ERROR HAPPENS. SORRY BRO :( . ERR =', errCode)
        return
      }

      console.log('INFO: JEELIZFACEFILTER IS READY')
      init_threeScene(spec)
    },

    // called at each render iteration (drawing loop)
    callbackTrack: function (detectState) {
      JeelizThreeHelper.render(detectState, THREECAMERA)
    }
  })
}


function app() {
  JeelizResizer.size_canvas({
    canvasId: 'jeeFaceFilterCanvas',
    callback: function (isError, bestVideoSettings) {
      init_faceFilter(bestVideoSettings)
    }
  })
}


onMounted(() => {
  app()
})

</script>


<template>
  <TresCanvas id="jeeFaceFilterCanvas">
    <!-- <Environment files="envMap/evening_road_01_puresky_4k.hdr"></Environment>
    <TresPerspectiveCamera></TresPerspectiveCamera>
    <TresDirectionalLight :intensity="1" :position="[1, 0, 1]"></TresDirectionalLight>
    <TresAmbientLight :intensity="1" :position="[1, 0, 1]"></TresAmbientLight>
    <TresSpotLight :intensity="1" :position="[1, 0, 1]"></TresSpotLight>

    <TresMesh>
      <TresTorusGeometry :args="[1, 0.5, 16, 32]"></TresTorusGeometry>
      <TresMeshPhongMaterial color="orange"></TresMeshPhongMaterial>
    </TresMesh>

    <OrbitControls></OrbitControls> -->
  </TresCanvas>
</template>