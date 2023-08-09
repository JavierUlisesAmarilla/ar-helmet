<script setup lang='ts' >
import { TresCanvas } from '@tresjs/core'
import { OrbitControls } from '@tresjs/cientos'
</script>

<template>
  <TresCanvas>
    <TresPerspectiveCamera></TresPerspectiveCamera>
    <TresMesh>
      <TresTorusGeometry :args="[1, 0.5, 16, 32]"></TresTorusGeometry>
      <TresMeshBasicMaterial color="orange"></TresMeshBasicMaterial>
    </TresMesh>
    <TresAmbientLight :intensity="1"></TresAmbientLight>
    <OrbitControls></OrbitControls>
  </TresCanvas>
</template>