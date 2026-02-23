# GAME-TECH-REF.md

> AI assistant reference for **game development** patterns.
> Three.js/R3F sections verified via Context7 MCP (2026-02-20).
> Unity and Unreal sections use stable, documented API patterns.

---

## 📐 Project Type Classification

| Tag | Engine / Platform |
| --- | --- |
| `[WEB3D]` | Three.js (vanilla) |
| `[R3F]` | React Three Fiber + Drei |
| `[PHYS]` | Rapier / Cannon.js physics |
| `[UNITY]` | Unity 6 / 2022 LTS (C#) |
| `[UE5]` | Unreal Engine 5 (Blueprints + C++) |
| `[UNIV-G]` | Universal game patterns |

---

## ⚡ Quick Engine Selector

| Use Case | Recommended |
| --- | --- |
| Web browser game / interactive 3D | R3F + Drei + Rapier |
| Pure Three.js, no React | Three.js r170+ |
| Mobile game (iOS/Android) | Unity 6 with URP |
| AAA / Open world / High fidelity | Unreal Engine 5 |
| 2D web game | Phaser.js (not in this ref) |
| Multiplayer browser game | Three.js + Socket.io / Colyseus |

---

## 1. `[WEB3D]` Three.js r170+

> **Install:** `npm install three`
> **TypeScript types:** `npm install -D @types/three`

### ✅ Scene setup (vanilla)

```ts
import * as THREE from 'three';

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(
  75,                                   // FOV (degrees)
  window.innerWidth / window.innerHeight, // aspect ratio
  0.1,                                  // near clip
  1000                                  // far clip
);
camera.position.z = 5;

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // cap at 2x
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Handle resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
```

### ✅ Mesh creation

```ts
// Geometry + Material + Mesh
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({
  color: 0x4488ff,
  roughness: 0.5,
  metalness: 0.1,
});
const cube = new THREE.Mesh(geometry, material);
cube.castShadow = true;
scene.add(cube);

// Ground plane
const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.MeshStandardMaterial({ color: 0x888888 })
);
plane.rotation.x = -Math.PI / 2;
plane.receiveShadow = true;
scene.add(plane);
```

### ✅ Lighting

```ts
// Ambient (fills shadows)
const ambient = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambient);

// Directional (sun-like)
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 5);
dirLight.castShadow = true;
dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far = 50;
dirLight.shadow.mapSize.set(2048, 2048);
scene.add(dirLight);

// Point light (bulb-like)
const point = new THREE.PointLight(0xff9900, 2, 10);
point.position.set(0, 3, 0);
scene.add(point);
```

### ✅ Render loop

```ts
// ✅ Use clock + delta for frame-rate-independent movement
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta(); // seconds since last frame

  cube.rotation.y += delta * 0.5;

  renderer.render(scene, camera);
}
animate();
```

> ❌ Do NOT use raw `Date.now()` for delta — use `THREE.Clock`
> ❌ Do NOT mutate geometry vertices every frame — use instancing or shaders

### ✅ Load GLTF model

```ts
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

const loader = new GLTFLoader();

// Optional: Draco compression
const draco = new DRACOLoader();
draco.setDecoderPath('/draco/');
loader.setDRACOLoader(draco);

loader.load('/models/character.glb', (gltf) => {
  const model = gltf.scene;
  model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  scene.add(model);
});
```

### ✅ Animation mixer

```ts
let mixer: THREE.AnimationMixer;

loader.load('/models/character.glb', (gltf) => {
  scene.add(gltf.scene);
  mixer = new THREE.AnimationMixer(gltf.scene);

  const idle = mixer.clipAction(gltf.animations[0]);
  idle.play();
});

// In render loop:
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  mixer?.update(delta); // ← update mixer every frame
  renderer.render(scene, camera);
}
```

### ✅ Raycasting (mouse picking)

```ts
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

window.addEventListener('click', (event) => {
  // Normalize device coordinates (-1 to +1)
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(scene.children, true);
  if (hits.length > 0) {
    console.log('Hit:', hits[0].object.name);
  }
});
```

### ✅ Reuse geometries and materials (performance)

```ts
// ✅ Define ONCE, reuse across many meshes
const geo = new THREE.BoxGeometry(1, 1, 1);
const mat = new THREE.MeshStandardMaterial({ color: 'red' });

for (let i = 0; i < 1000; i++) {
  const mesh = new THREE.Mesh(geo, mat); // shared, not cloned
  mesh.position.set(Math.random() * 20, 0, Math.random() * 20);
  scene.add(mesh);
}

// ✅ For 1000+ identical objects: use InstancedMesh instead
const instanced = new THREE.InstancedMesh(geo, mat, 1000);
const dummy = new THREE.Object3D();
for (let i = 0; i < 1000; i++) {
  dummy.position.set(Math.random() * 20, 0, Math.random() * 20);
  dummy.updateMatrix();
  instanced.setMatrixAt(i, dummy.matrix);
}
scene.add(instanced);
```

> ❌ Do NOT create new `THREE.Vector3()` inside `useFrame` / render loop — pre-allocate

---

## 2. `[R3F]` React Three Fiber v8

> **Install:** `npm install @react-three/fiber three`
> Declarative Three.js — every R3F component maps 1:1 to a Three.js class.

### ✅ Canvas setup

```tsx
import { Canvas } from '@react-three/fiber';

export default function App() {
  return (
    <Canvas
      camera={{ position: [0, 2, 5], fov: 75 }}
      shadows
      gl={{ antialias: true }}
      style={{ width: '100vw', height: '100vh' }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} castShadow />
      <Scene />
    </Canvas>
  );
}
```

### ✅ useFrame — frame loop

```tsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';

function RotatingCube() {
  const ref = useRef<Mesh>(null);

  // ✅ Mutate ref directly — do NOT use setState in useFrame
  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.5;
    // time-based: state.clock.elapsedTime
  });

  return (
    <mesh ref={ref} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="royalblue" />
    </mesh>
  );
}
```

> ❌ Never call `setState` inside `useFrame` — causes re-render storm
> ❌ Never skip the `delta` parameter for rotation/movement — frame-rate dependent

### ✅ useThree — access scene state

```tsx
import { useThree } from '@react-three/fiber';

function CameraInfo() {
  const { camera, gl, scene, size, viewport } = useThree();
  // camera: THREE.Camera
  // gl: THREE.WebGLRenderer
  // size: { width, height } in pixels
  // viewport: { width, height } in world units
  return null;
}
```

### ✅ Events on meshes

```tsx
// R3F auto-handles raycasting — just attach event props
<mesh
  onClick={(e) => { e.stopPropagation(); console.log('clicked'); }}
  onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
  onPointerOut={() => setHovered(false)}
  onPointerMissed={() => setSelected(null)}
>
  <boxGeometry />
  <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
</mesh>
```

### ✅ Load GLTF with Suspense

```tsx
import { Suspense } from 'react';
import { useGLTF } from '@react-three/drei';

function Character({ url }: { url: string }) {
  const { scene, animations } = useGLTF(url);
  return <primitive object={scene} />;
}

// Preload so it doesn't suspend mid-game
useGLTF.preload('/models/character.glb');

// In parent:
<Suspense fallback={<LoadingIndicator />}>
  <Character url="/models/character.glb" />
</Suspense>
```

### ✅ Performance: shared geometry + material

```tsx
import * as THREE from 'three';

// Define outside component — created once
const sharedGeo = new THREE.BoxGeometry();
const sharedMat = new THREE.MeshStandardMaterial({ color: 'red' });

function EnemyPack() {
  return (
    <>
      {positions.map((pos, i) => (
        <mesh key={i} position={pos} geometry={sharedGeo} material={sharedMat} />
      ))}
    </>
  );
}
```

---

## 3. `[R3F]` Drei Helpers

> **Install:** `npm install @react-three/drei`
> Over 100 helpers. Context7 ID: `/pmndrs/drei` (score 90.3)

### ✅ Camera controls

```tsx
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

<Canvas>
  {/* makeDefault registers it as the scene camera */}
  <PerspectiveCamera makeDefault position={[0, 2, 8]} fov={60} />
  <OrbitControls
    makeDefault
    enableDamping
    dampingFactor={0.05}
    minDistance={2}
    maxDistance={50}
    maxPolarAngle={Math.PI / 2} // prevent going underground
  />
</Canvas>
```

### ✅ Environment & lighting

```tsx
import { Environment, Sky, Stars } from '@react-three/drei';

// HDRI environment map (lighting + reflections)
<Environment preset="sunset" />
// Presets: 'apartment' | 'city' | 'dawn' | 'forest' | 'lobby'
//          'night' | 'park' | 'studio' | 'sunset' | 'warehouse'

// Procedural sky
<Sky distance={450000} sunPosition={[0, 1, 0]} />

// Star field
<Stars radius={100} depth={50} count={5000} factor={4} fade />
```

### ✅ Load assets

```tsx
import { useGLTF, useTexture, useAnimations } from '@react-three/drei';

// GLTF with animations
function AnimatedModel() {
  const group = useRef();
  const { scene, animations } = useGLTF('/model.glb');
  const { actions, names } = useAnimations(animations, group);

  useEffect(() => {
    actions['Idle']?.play(); // play on mount
  }, [actions]);

  return <primitive ref={group} object={scene} />;
}

// Texture
function TexturedMesh() {
  const texture = useTexture('/textures/diffuse.jpg');
  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}
```

### ✅ Text (3D Billboard)

```tsx
import { Text, Billboard } from '@react-three/drei';

// 3D text that always faces camera
<Billboard>
  <Text fontSize={0.5} color="white" anchorX="center" anchorY="middle">
    Player Name
  </Text>
</Billboard>
```

### ✅ HTML overlay in 3D space

```tsx
import { Html } from '@react-three/drei';

<mesh position={[0, 2, 0]}>
  <Html center distanceFactor={10} occlude>
    <div className="health-bar">❤️ 100 HP</div>
  </Html>
</mesh>
```

### ✅ Useful Drei quick reference

| Component | Purpose |
| --- | --- |
| `<OrbitControls>` | Mouse orbit camera |
| `<FlyControls>` | WASD fly camera |
| `<PointerLockControls>` | FPS camera |
| `<Environment preset="...">` | IBL lighting |
| `<Sky>` | Procedural sky |
| `<Stars>` | Star field |
| `<useGLTF>` | GLTF loader with cache |
| `<useTexture>` | Texture loader |
| `<useAnimations>` | AnimationMixer wrapper |
| `<Text>` | SDF font text |
| `<Html>` | DOM inside 3D scene |
| `<Instances>` | GPU instancing declarative |
| `<Bvh>` | BVH raycasting acceleration |
| `<SoftShadows>` | Better shadow quality |
| `<Stats>` | FPS performance overlay |
| `<Grid>` | Grid helper |
| `<GizmoHelper>` | Transform gizmo |

---

## 4. `[PHYS]` Rapier Physics (react-three-rapier)

> **Install:** `npm install @react-three/rapier`
> WASM-based, deterministic physics. Context7 ID: `/pmndrs/react-three-rapier` (score 91.2)

### ✅ Setup — Physics world

```tsx
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Suspense } from 'react';

export default function App() {
  return (
    <Canvas>
      <Suspense> {/* Rapier WASM loads async */}
        <Physics
          gravity={[0, -9.81, 0]} // Earth gravity
          // debug  // ← uncomment to see collider wireframes
        >
          <Scene />
        </Physics>
      </Suspense>
    </Canvas>
  );
}
```

### ✅ RigidBody — dynamic physics object

```tsx
import { RigidBody } from '@react-three/rapier';

function PhysicsBox() {
  return (
    // colliders="cuboid" is auto-detected from mesh shape
    <RigidBody position={[0, 5, 0]} restitution={0.7} friction={0.5}>
      <mesh castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="blue" />
      </mesh>
    </RigidBody>
  );
}

// Static ground (type="fixed" = immovable)
function Ground() {
  return (
    <RigidBody type="fixed">
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#888" />
      </mesh>
    </RigidBody>
  );
}
```

### ✅ Apply forces and impulses

```tsx
import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import { useRef } from 'react';

function JumpingBox() {
  const bodyRef = useRef<RapierRigidBody>(null);

  function jump() {
    if (!bodyRef.current) return;
    // One-off upward push
    bodyRef.current.applyImpulse({ x: 0, y: 8, z: 0 }, true);
  }

  function addWindForce() {
    // Continuous force (called every frame in useFrame)
    bodyRef.current?.addForce({ x: 1, y: 0, z: 0 }, true);
  }

  function spin() {
    // One-off torque
    bodyRef.current?.applyTorqueImpulse({ x: 0, y: 2, z: 0 }, true);
  }

  return (
    <RigidBody ref={bodyRef} position={[0, 3, 0]}>
      <mesh onClick={jump} castShadow>
        <boxGeometry />
        <meshStandardMaterial color="green" />
      </mesh>
    </RigidBody>
  );
}
```

### ✅ Collider types

```tsx
import { BallCollider, CuboidCollider, CapsuleCollider } from '@react-three/rapier';

// Manual colliders (override auto-detection)
<RigidBody colliders={false}>
  <mesh><sphereGeometry /></mesh>
  <BallCollider args={[0.5]} />
</RigidBody>

<RigidBody colliders={false}>
  <mesh><capsuleGeometry /></mesh>
  <CapsuleCollider args={[0.5, 0.5]} /> {/* half-height, radius */}
</RigidBody>

// ✅ Best for characters: CapsuleCollider (prevents edge catching)
```

### ✅ Kinematic body (player-controlled)

```tsx
import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import { useFrame } from '@react-three/fiber';

function KinematicPlayer() {
  const ref = useRef<RapierRigidBody>(null);

  useFrame(() => {
    if (!ref.current) return;
    const pos = ref.current.translation();
    // Move manually (kinematic ignores gravity/forces)
    ref.current.setNextKinematicTranslation({
      x: pos.x + 0.01,
      y: pos.y,
      z: pos.z,
    });
  });

  return (
    <RigidBody ref={ref} type="kinematicPosition">
      <mesh><capsuleGeometry args={[0.5, 1]} /></mesh>
    </RigidBody>
  );
}
```

### ✅ Collision events

```tsx
<RigidBody
  onCollisionEnter={({ other }) => {
    console.log('Collided with:', other.rigidBodyObject?.name);
  }}
  onCollisionExit={() => console.log('Separated')}
  onIntersectionEnter={() => console.log('Sensor triggered')} // sensor colliders
>
  <mesh><boxGeometry /></mesh>
</RigidBody>
```

> ❌ Do NOT put Rapier physics objects outside `<Physics>` — silently fails
> ❌ Do NOT forget `<Suspense>` around `<Physics>` — WASM loads async

---

## 5. `[UNITY]` Unity 6 / C# Patterns

> Targets Unity 6 LTS and Unity 2022.3 LTS. Uses Universal Render Pipeline (URP).

### ✅ MonoBehaviour lifecycle

```csharp
using UnityEngine;

public class PlayerController : MonoBehaviour
{
    [SerializeField] private float speed = 5f;
    [SerializeField] private float jumpForce = 8f;

    private Rigidbody _rb;
    private bool _isGrounded;

    // Called once when object is created
    void Awake()
    {
        _rb = GetComponent<Rigidbody>();
    }

    // Called once after Awake, before first Update
    void Start()
    {
        Debug.Log("Player started");
    }

    // Called every frame
    void Update()
    {
        float h = Input.GetAxis("Horizontal");
        float v = Input.GetAxis("Vertical");
        Vector3 dir = new Vector3(h, 0, v).normalized;
        transform.Translate(dir * speed * Time.deltaTime, Space.World);

        if (Input.GetButtonDown("Jump") && _isGrounded)
            _rb.AddForce(Vector3.up * jumpForce, ForceMode.Impulse);
    }

    // Called at fixed timestep (use for physics)
    void FixedUpdate()
    {
        // Physics operations here
    }

    void OnCollisionEnter(Collision col)
    {
        if (col.gameObject.CompareTag("Ground"))
            _isGrounded = true;
    }

    void OnCollisionExit(Collision col)
    {
        if (col.gameObject.CompareTag("Ground"))
            _isGrounded = false;
    }
}
```

> ❌ Do NOT use `Find()` in `Update()` — cache references in `Awake()`
> ❌ Do NOT use physics (AddForce, MovePosition) in `Update()` — use `FixedUpdate()`

### ✅ Lifecycle order

```text
Awake → OnEnable → Start → FixedUpdate → Update → LateUpdate → OnDisable → OnDestroy
```

### ✅ Coroutines

```csharp
// ✅ Non-blocking wait without threads
IEnumerator SpawnWave()
{
    for (int i = 0; i < 5; i++)
    {
        Instantiate(enemyPrefab, spawnPoint.position, Quaternion.identity);
        yield return new WaitForSeconds(1f);
    }
}

// Start it:
StartCoroutine(SpawnWave());

// Stop it:
StopCoroutine(SpawnWave());
// Or cache and stop by reference:
Coroutine routine = StartCoroutine(SpawnWave());
StopCoroutine(routine);
```

### ✅ ScriptableObjects (data containers)

```csharp
// Create asset via menu
[CreateAssetMenu(menuName = "Game/WeaponData")]
public class WeaponData : ScriptableObject
{
    public string weaponName;
    public int damage;
    public float fireRate;
    public Sprite icon;
}

// Use in MonoBehaviour:
[SerializeField] private WeaponData weaponData;

void Shoot()
{
    // Apply damage
    int dmg = weaponData.damage;
}
```

### ✅ Events — decoupled communication

```csharp
// Static event (simple, avoid in large projects)
public static event System.Action<int> OnScoreChanged;
OnScoreChanged?.Invoke(newScore);

// UnityEvent (Inspector configurable)
using UnityEngine.Events;
[SerializeField] private UnityEvent onPlayerDeath;
onPlayerDeath.Invoke();

// C# Action with UnityEvent hybrid
[SerializeField] private UnityEvent<int> onHealthChanged;
onHealthChanged.Invoke(currentHealth);
```

### ✅ Object pooling (Unity 2021+)

```csharp
using UnityEngine.Pool;

public class BulletPool : MonoBehaviour
{
    [SerializeField] private GameObject bulletPrefab;
    private ObjectPool<GameObject> _pool;

    void Awake()
    {
        _pool = new ObjectPool<GameObject>(
            createFunc: () => Instantiate(bulletPrefab),
            actionOnGet: (obj) => obj.SetActive(true),
            actionOnRelease: (obj) => obj.SetActive(false),
            actionOnDestroy: (obj) => Destroy(obj),
            maxSize: 50
        );
    }

    public void Shoot()
    {
        var bullet = _pool.Get();
        // ... setup bullet
    }

    public void ReturnBullet(GameObject bullet)
    {
        _pool.Release(bullet);
    }
}
```

> ❌ Do NOT use `Instantiate`/`Destroy` in tight loops — use Object Pooling
> ❌ Do NOT use `GameObject.Find()` — use `[SerializeField]` or `GetComponent()`

### ✅ New Input System (Unity 2021+)

```csharp
using UnityEngine.InputSystem;

public class PlayerInput : MonoBehaviour
{
    // Generated from Input Actions asset
    private PlayerInputActions _actions;

    void Awake()
    {
        _actions = new PlayerInputActions();
    }

    void OnEnable()
    {
        _actions.Player.Enable();
        _actions.Player.Jump.performed += OnJump;
        _actions.Player.Fire.performed += OnFire;
    }

    void OnDisable()
    {
        _actions.Player.Jump.performed -= OnJump;
        _actions.Player.Fire.performed -= OnFire;
        _actions.Player.Disable();
    }

    void OnJump(InputAction.CallbackContext ctx) => Jump();
    void OnFire(InputAction.CallbackContext ctx) => Fire();

    void Update()
    {
        // Read continuous input
        Vector2 move = _actions.Player.Move.ReadValue<Vector2>();
    }
}
```

> ❌ Old: `Input.GetKeyDown(KeyCode.Space)` — still works but avoid in new projects
> ✅ New: `_actions.Player.Jump.performed`

### ✅ Animator (state machine)

```csharp
private Animator _anim;

void Awake() => _anim = GetComponent<Animator>();

// Set parameters
_anim.SetBool("IsRunning", true);
_anim.SetFloat("Speed", velocity.magnitude);
_anim.SetTrigger("Jump");
_anim.SetInteger("WeaponType", 2);

// Cross-fade to state by name
_anim.CrossFade("Attack", 0.15f); // 0.15s transition
```

---

## 6. `[UE5]` Unreal Engine 5 Patterns

> Targeting UE 5.3+. Covers Blueprints (BP) and C++.
> Common plugin dependencies: Chaos Physics (built-in), Nanite, Lumen.

### ✅ Actor lifecycle (C++)

```cpp
#include "GameFramework/Actor.h"

AMyActor::AMyActor()
{
    // Constructor: set defaults, create components
    PrimaryActorTick.bCanEverTick = true; // enable Tick
    
    RootComponent = CreateDefaultSubobject<USceneComponent>(TEXT("Root"));
    StaticMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("Mesh"));
    StaticMesh->SetupAttachment(RootComponent);
}

void AMyActor::BeginPlay()
{
    Super::BeginPlay();
    // Called when game starts or actor spawns
}

void AMyActor::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);
    // Called every frame if PrimaryActorTick.bCanEverTick = true
    AddActorLocalRotation(FRotator(0, 45.f * DeltaTime, 0));
}

void AMyActor::EndPlay(const EEndPlayReason::Type EndPlayReason)
{
    Super::EndPlay(EndPlayReason);
    // Cleanup
}
```

### ✅ Character movement (C++)

```cpp
#include "GameFramework/Character.h"
#include "GameFramework/CharacterMovementComponent.h"

AMyCharacter::AMyCharacter()
{
    GetCharacterMovement()->MaxWalkSpeed = 600.f;
    GetCharacterMovement()->JumpZVelocity = 600.f;
    GetCharacterMovement()->AirControl = 0.35f;
    GetCharacterMovement()->GravityScale = 1.75f;
    GetCharacterMovement()->bOrientRotationToMovement = true;
}

void AMyCharacter::MoveForward(float Value)
{
    if (Value != 0.f)
    {
        const FRotator Rotation = Controller->GetControlRotation();
        const FRotator YawRotation(0, Rotation.Yaw, 0);
        const FVector Direction = FRotationMatrix(YawRotation).GetUnitAxis(EAxis::X);
        AddMovementInput(Direction, Value);
    }
}
```

### ✅ UPROPERTY / UFUNCTION decorators

```cpp
UCLASS()
class MYGAME_API AMyActor : public AActor
{
    GENERATED_BODY()

public:
    // Editable in Blueprint and Editor
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Stats")
    float Health = 100.f;

    // Read-only in BP, editable in Editor
    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Config")
    int32 MaxAmmo = 30;

    // Callable from Blueprint
    UFUNCTION(BlueprintCallable, Category = "Combat")
    void ApplyDamage(float Amount);

    // Implementable event (override in Blueprint)
    UFUNCTION(BlueprintImplementableEvent, Category = "Events")
    void OnDeath();

    // Native event (implement in C++, overridable in BP)
    UFUNCTION(BlueprintNativeEvent, Category = "Combat")
    float GetDamageMultiplier();
    virtual float GetDamageMultiplier_Implementation();
};
```

### ✅ Delegates (events)

```cpp
// Declare in .h
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnHealthChanged, float, NewHealth);

UPROPERTY(BlueprintAssignable, Category = "Events")
FOnHealthChanged OnHealthChanged;

// Broadcast in .cpp
OnHealthChanged.Broadcast(CurrentHealth);

// Bind in Blueprint or C++
OnHealthChanged.AddDynamic(this, &UMyWidget::UpdateHealthBar);
```

### ✅ Spawn actor

```cpp
// In .h
UPROPERTY(EditDefaultsOnly)
TSubclassOf<AActor> ProjectileClass;

// In .cpp
FActorSpawnParameters Params;
Params.Owner = this;
Params.Instigator = GetInstigator();

GetWorld()->SpawnActor<AProjectile>(
    ProjectileClass,
    SpawnLocation,
    SpawnRotation,
    Params
);
```

### ✅ Enhanced Input (UE 5.1+)

```cpp
// In Character.h
#include "InputActionValue.h"
class UInputMappingContext;
class UInputAction;

UPROPERTY(EditDefaultsOnly, Category = "Input")
UInputMappingContext* DefaultMappingContext;

UPROPERTY(EditDefaultsOnly, Category = "Input")
UInputAction* IA_Move;

// In SetupPlayerInputComponent
void AMyCharacter::SetupPlayerInputComponent(UInputComponent* Input)
{
    Super::SetupPlayerInputComponent(Input);
    if (auto* EIC = Cast<UEnhancedInputComponent>(Input))
    {
        EIC->BindAction(IA_Move, ETriggerEvent::Triggered, this, &AMyCharacter::Move);
        EIC->BindAction(IA_Jump, ETriggerEvent::Started, this, &ACharacter::Jump);
    }
}

void AMyCharacter::Move(const FInputActionValue& Value)
{
    FVector2D Input = Value.Get<FVector2D>();
    AddMovementInput(GetActorForwardVector(), Input.Y);
    AddMovementInput(GetActorRightVector(), Input.X);
}
```

> ❌ Old: `BindAxis("MoveForward", ...)` — deprecated in UE5
> ✅ New: Enhanced Input System with `UInputAction` assets

### ✅ Blueprint cheat sheet

| Blueprint Node | C++ Equivalent |
| --- | --- |
| `Print String` | `UE_LOG(LogTemp, Warning, TEXT("..."))` |
| `Get Player Character` | `GetWorld()->GetFirstPlayerController()->GetCharacter()` |
| `Cast To X` | `Cast<AMyActor>(OtherActor)` |
| `Delay` | Timers: `GetWorldTimerManager().SetTimer(...)` |
| `Branch` | `if / else` |
| `For Loop` | `for (int32 i = 0; i < Count; i++)` |
| `Spawn Actor` | `GetWorld()->SpawnActor<>()` |
| `Is Valid` | `IsValid(Ptr)` or `Ptr != nullptr` |

---

## 7. `[UNIV-G]` Universal Game Patterns

### ✅ State machine (TypeScript / C# agnostic concept)

```ts
// Simple enum-based state machine (works in TS/Unity C#)
enum GameState { MainMenu, Playing, Paused, GameOver }

class GameManager {
  private state: GameState = GameState.MainMenu;

  transition(next: GameState) {
    // exit current
    this.onExit(this.state);
    this.state = next;
    // enter next
    this.onEnter(this.state);
  }

  private onEnter(s: GameState) {
    if (s === GameState.Playing) this.startTimer();
    if (s === GameState.GameOver) this.showScore();
  }

  private onExit(s: GameState) {
    if (s === GameState.Playing) this.stopTimer();
  }
}
```

### ✅ Object Pool pattern

```ts
class ObjectPool<T> {
  private pool: T[] = [];

  constructor(
    private create: () => T,
    private reset: (obj: T) => void,
    initialSize = 10
  ) {
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(create());
    }
  }

  acquire(): T {
    return this.pool.length > 0 ? this.pool.pop()! : this.create();
  }

  release(obj: T) {
    this.reset(obj);
    this.pool.push(obj);
  }
}

// Usage
const bulletPool = new ObjectPool(
  () => new Bullet(),
  (b) => { b.active = false; b.position.set(0, 0, 0); }
);
```

### ✅ ECS-inspired data separation

```ts
// Separate data (components) from behaviour (systems)
// Components: plain data
interface Transform { position: Vec3; rotation: Quat; }
interface Health { current: number; max: number; }
interface Velocity { linear: Vec3; angular: Vec3; }

// System: operate on components
function movementSystem(entities: Map<number, { transform: Transform; velocity: Velocity }>, dt: number) {
  for (const [, e] of entities) {
    e.transform.position.x += e.velocity.linear.x * dt;
    e.transform.position.y += e.velocity.linear.y * dt;
    e.transform.position.z += e.velocity.linear.z * dt;
  }
}
```

### ✅ Easing functions

```ts
// Common easing for smooth animations
const Easing = {
  linear:     (t: number) => t,
  easeIn:     (t: number) => t * t,
  easeOut:    (t: number) => 1 - (1 - t) * (1 - t),
  easeInOut:  (t: number) => t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2)/2,
  bounce:     (t: number) => {
    const n1 = 7.5625, d1 = 2.75;
    if (t < 1/d1) return n1*t*t;
    if (t < 2/d1) return n1*(t-=1.5/d1)*t + 0.75;
    if (t < 2.5/d1) return n1*(t-=2.25/d1)*t + 0.9375;
    return n1*(t-=2.625/d1)*t + 0.984375;
  },
};

// Lerp with delta (frame-rate independent)
function lerpDelta(a: number, b: number, t: number, dt: number): number {
  return a + (b - a) * (1 - Math.pow(1 - t, dt * 60));
}
```

---

## 🚫 Universal Anti-Pattern Cheatsheet

| ❌ Anti-Pattern | ✅ Correct |
| --- | --- |
| `new THREE.Vector3()` inside render loop | Pre-allocate, reuse |
| `setState` inside `useFrame` | Mutate refs directly |
| `Instantiate`/`Destroy` per projectile (Unity) | Object pooling |
| `GameObject.Find()` in Update | Cache in `Awake` / `[SerializeField]` |
| Physics in Unity `Update()` | Use `FixedUpdate()` |
| `Input.GetKeyDown()` new projects (Unity) | Enhanced Input System |
| `BindAxis("Move", ...)` in UE5 | Enhanced Input `UInputAction` |
| Physics without `<Suspense>` in Rapier | Wrap `<Physics>` in `<Suspense>` |
| Missing `delta` in movement math | Always multiply by `delta` / `DeltaTime` |
| Separate material per identical mesh | Share single material instance |
| 1000 individual meshes | `InstancedMesh` (Three.js) / `Instances` (Drei) |

---

## 📦 Package Quick Reference

### Three.js ecosystem

| Package | Purpose | Install |
| --- | --- | --- |
| `three` | 3D engine | `npm i three` |
| `@types/three` | TS types | `npm i -D @types/three` |
| `@react-three/fiber` | React renderer | `npm i @react-three/fiber` |
| `@react-three/drei` | Helpers + controls | `npm i @react-three/drei` |
| `@react-three/rapier` | Physics (Rapier) | `npm i @react-three/rapier` |
| `@react-three/postprocessing` | Bloom, SSAO, DoF | `npm i @react-three/postprocessing` |
| `leva` | Debug UI controls | `npm i leva` |
| `zustand` | Game state store | `npm i zustand` |
| `cannon-es` | Alt physics (JS) | `npm i cannon-es` |

### Unity packages (Package Manager)

| Package | Purpose |
| --- | --- |
| Universal RP | Modern rendering |
| Input System | New input handling |
| Cinemachine | Procedural cameras |
| TextMeshPro | High-quality UI text |
| Addressables | Asset streaming |
| Netcode for GameObjects | Multiplayer |
| Unity Physics | DOTS physics |

### Unreal Engine 5 plugins

| Plugin | Purpose |
| --- | --- |
| Enhanced Input | New input handling |
| Chaos Physics | Built-in physics |
| Nanite | Virtualized geometry |
| Lumen | Dynamic global illumination |
| MetaSounds | Procedural audio |
| Gameplay Ability System (GAS) | RPG abilities/buffs |
| CommonUI | Multiplatform UI |

---

## 🔗 Context7 Source Verification

| Library | Context7 ID | Verified |
| --- | --- | --- |
| React Three Fiber | `/pmndrs/react-three-fiber` | 2026-02-20 ✅ |
| Drei | `/pmndrs/drei` | 2026-02-20 ✅ |
| react-three-rapier | `/pmndrs/react-three-rapier` | 2026-02-20 ✅ |
| Phaser.js | `/websites/phaser_io_phaser` | 2026-02-20 ✅ |
| Three.js ShaderMaterial | `/mrdoob/three.js` | 2026-02-20 ✅ |
| Three.js WebGPU + TSL | `/llmstxt/threejs_llms-full_txt` | 2026-02-20 ✅ |
| Godot 4.x | `/websites/godotengine_en_4_5` | 2026-02-20 ✅ |

> **To update:** Ask AI: *"Cross-check GAME-TECH-REF.md against Context7 for [library]. Update any deprecated patterns."*

---

## 8. `[WEB3D]` Three.js — Shaders & Post-Processing

> Context7 ID: `/mrdoob/three.js` (13,375 snippets, High reputation)

### ✅ ShaderMaterial — custom GLSL

```ts
import * as THREE from 'three';

const material = new THREE.ShaderMaterial({
  uniforms: {
    time:       { value: 0.0 },
    resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    color:      { value: new THREE.Color(0x4488ff) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormal;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform float time;
    uniform vec3 color;
    varying vec2 vUv;
    varying vec3 vNormal;

    void main() {
      // Fresnel rim effect
      float rim = 1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0));
      vec3 final = mix(color, vec3(1.0), rim * 0.5);
      gl_FragColor = vec4(final + sin(time) * 0.1, 1.0);
    }
  `,
  transparent: false,
  side: THREE.FrontSide,
});

// Update uniform in render loop
function animate() {
  requestAnimationFrame(animate);
  material.uniforms.time.value = clock.getElapsedTime();
  renderer.render(scene, camera);
}
```

### ✅ EffectComposer — post-processing pipeline

```ts
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

// Setup
const renderTarget = new THREE.WebGLRenderTarget(
  window.innerWidth, window.innerHeight,
  { type: THREE.HalfFloatType }
);
const composer = new EffectComposer(renderer, renderTarget);

// 1. Base scene render
composer.addPass(new RenderPass(scene, camera));

// 2. Bloom (glow effect)
const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.5,  // strength
  0.4,  // radius
  0.85  // threshold
);
composer.addPass(bloom);

// 3. FXAA anti-aliasing
const fxaa = new ShaderPass(FXAAShader);
fxaa.uniforms['resolution'].value.set(
  1 / window.innerWidth,
  1 / window.innerHeight
);
composer.addPass(fxaa);

// 4. Output (tone mapping + sRGB)
composer.addPass(new OutputPass());

// In render loop: use composer instead of renderer
function animate() {
  requestAnimationFrame(animate);
  composer.render(); // ← NOT renderer.render()
}
```

> ❌ Do NOT mix `renderer.render()` and `composer.render()` in the same loop
> ❌ Do NOT forget `OutputPass` at the end — otherwise colors will look washed out

### ✅ R3F post-processing (@react-three/postprocessing)

```tsx
import { EffectComposer, Bloom, FXAA, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

<Canvas>
  {/* ...scene... */}
  <EffectComposer>
    <Bloom intensity={0.5} luminanceThreshold={0.85} mipmapBlur />
    <Vignette eskil={false} offset={0.1} darkness={0.8} />
    <FXAA />
  </EffectComposer>
</Canvas>
```

---

## 9. `[WEB2D]` Phaser 3

> **Install:** `npm install phaser`
> 2D game framework — Canvas + WebGL. Context7 ID: `/websites/phaser_io_phaser` (score 89)

### ✅ Game config & launch

```ts
import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,          // AUTO picks WebGL, falls back to Canvas
  width: 800,
  height: 600,
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug: process.env.NODE_ENV === 'development',
    },
  },
  scene: [GameScene, UIScene], // array = load in order; UIScene runs on top
};

new Phaser.Game(config);
```

### ✅ Scene class lifecycle

```ts
import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super({ key: 'GameScene' });
  }

  // 1. Load assets
  preload() {
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/ground.png');
    this.load.spritesheet('player', 'assets/player.png', {
      frameWidth: 32,
      frameHeight: 48,
    });
    this.load.tilemapTiledJSON('map', 'assets/level1.json');
  }

  // 2. Build scene
  create() {
    // Background
    this.add.image(400, 300, 'sky');

    // Static platforms
    this.platforms = this.physics.add.staticGroup();
    this.platforms.create(400, 568, 'ground').setScale(2).refreshBody();
    this.platforms.create(600, 400, 'ground');

    // Player with physics
    this.player = this.physics.add.sprite(100, 450, 'player');
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);

    // Animations
    this.anims.create({
      key: 'walk',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'idle',
      frames: [{ key: 'player', frame: 4 }],
    });
    this.anims.create({
      key: 'jump',
      frames: [{ key: 'player', frame: 5 }],
    });

    // Collider
    this.physics.add.collider(this.player, this.platforms);

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys();
  }

  // 3. Game loop
  update() {
    const onGround = this.player.body!.blocked.down;

    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-160);
      this.player.setFlipX(true);
      this.player.play('walk', true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(160);
      this.player.setFlipX(false);
      this.player.play('walk', true);
    } else {
      this.player.setVelocityX(0);
      this.player.play('idle', true);
    }

    if (this.cursors.up.isDown && onGround) {
      this.player.setVelocityY(-500);
      this.player.play('jump', true);
    }
  }
}
```

### ✅ Tilemap (Tiled editor output)

```ts
create() {
  const map = this.make.tilemap({ key: 'map' });
  const tileset = map.addTilesetImage('tileset', 'tiles');

  // Layers from Tiled
  const ground = map.createLayer('Ground', tileset!, 0, 0)!;
  const objects = map.createLayer('Objects', tileset!, 0, 0)!;

  // Only tiles with collision property in Tiled
  ground.setCollisionByProperty({ collides: true });

  this.physics.add.collider(this.player, ground);

  // Camera follows player
  this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
  this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
  this.cameras.main.setZoom(2);
}
```

### ✅ Keyboard input (custom keys)

```ts
// In create():
const wasd = this.input.keyboard!.addKeys({
  up:    Phaser.Input.Keyboard.KeyCodes.W,
  down:  Phaser.Input.Keyboard.KeyCodes.S,
  left:  Phaser.Input.Keyboard.KeyCodes.A,
  right: Phaser.Input.Keyboard.KeyCodes.D,
  jump:  Phaser.Input.Keyboard.KeyCodes.SPACE,
}) as { up: Phaser.Input.Keyboard.Key, /* ... */ };

// In update():
if (Phaser.Input.Keyboard.JustDown(wasd.jump)) {
  // exactly on first frame of press
  this.player.setVelocityY(-500);
}
```

### ✅ Tweens (animation engine)

```ts
// Move object over time
this.tweens.add({
  targets: this.coin,
  y: '-=20',        // relative move up
  duration: 600,
  ease: 'Sine.easeInOut',
  yoyo: true,       // reverse back
  repeat: -1,       // loop forever
});

// Fade out then destroy
this.tweens.add({
  targets: enemy,
  alpha: 0,
  duration: 300,
  onComplete: () => enemy.destroy(),
});

// Chain multiple
this.tweens.chain({
  targets: door,
  tweens: [
    { x: 200, duration: 500 },
    { angle: 90, duration: 300 },
    { alpha: 0, duration: 200 },
  ],
});
```

### ✅ Groups & object pooling (Phaser way)

```ts
// Static physics group
const coins = this.physics.add.staticGroup();
[100, 200, 300].forEach(x => coins.create(x, 300, 'coin'));

// Overlap callback
this.physics.add.overlap(this.player, coins, (player, coin) => {
  (coin as Phaser.Physics.Arcade.Sprite).destroy();
  this.score += 10;
  this.scoreText.setText(`Score: ${this.score}`);
});

// Object pool pattern
const bullets = this.physics.add.group({
  classType: Phaser.Physics.Arcade.Sprite,
  maxSize: 30,
  runChildUpdate: true,
});

function fireBullet(x: number, y: number) {
  const bullet = bullets.get(x, y, 'bullet');
  if (bullet) {
    bullet.setActive(true).setVisible(true);
    bullet.setVelocityX(400);
  }
}
```

> ❌ Do NOT create sprites with `new Phaser.GameObjects.Sprite()` directly — use `this.add.sprite()`
> ❌ Do NOT run physics on `staticGroup` members — use `staticGroup` for immovable objects only

---

## 10. `[WEB2D]` `[WEB3D]` Audio — Howler.js

> **Install:** `npm install howler`
> Works in any web game context (Three.js, Phaser, R3F, vanilla).

```ts
import { Howl, Howler } from 'howler';

// Background music (loop)
const music = new Howl({
  src: ['/audio/music.webm', '/audio/music.mp3'], // format fallback
  loop: true,
  volume: 0.4,
  autoplay: false,
});

// Sound effects (preloaded sprite sheet)
const sfx = new Howl({
  src: ['/audio/sfx.webm'],
  sprite: {
    jump:     [0,    300],  // [offset ms, duration ms]
    coin:     [500,  200],
    explosion:[800,  800],
    death:    [1800, 1200],
  },
  volume: 0.7,
});

// Play
music.play();
sfx.play('jump');
sfx.play('coin');

// Global volume
Howler.volume(0.8); // 0.0 to 1.0

// Spatial audio (3D sound)
const footstep = new Howl({
  src: ['/audio/footstep.webm'],
  pannerAttr: { panningModel: 'HRTF' },
});
footstep.pos(playerX, playerY, 0);   // source position
Howler.pos(cameraX, cameraY, 0);     // listener position
```

---

## 11. `[WEB3D]` `[R3F]` Multiplayer — Socket.io + Colyseus

> **Socket.io:** Simple real-time, good for small multiplayer
> **Colyseus:** Game-specific, room management, state sync built-in

### ✅ Socket.io setup (client)

```ts
import { io, Socket } from 'socket.io-client';

const socket: Socket = io('wss://game.example.com', {
  autoConnect: false,
  reconnection: true,
});

socket.connect();

// Send player state every frame (throttled)
let lastSend = 0;
function gameLoop(time: number) {
  if (time - lastSend > 50) { // 20 updates/sec
    socket.emit('player:move', {
      x: player.position.x,
      y: player.position.y,
      rot: player.rotation.y,
    });
    lastSend = time;
  }
}

// Receive other player moves
socket.on('players:state', (players: Record<string, PlayerState>) => {
  for (const [id, state] of Object.entries(players)) {
    if (id === socket.id) continue; // skip self
    updateRemotePlayer(id, state);
  }
});

socket.on('player:joined', ({ id }) => addRemotePlayer(id));
socket.on('player:left',   ({ id }) => removeRemotePlayer(id));
socket.on('disconnect', () => console.warn('Disconnected'));
```

### ✅ Colyseus setup (client)

```ts
import { Client, Room } from 'colyseus.js';

const client = new Client('wss://game.example.com');

// Join or create room
const room: Room = await client.joinOrCreate('battle', {
  playerName: 'Alice',
});

// Listen to state changes
room.state.players.onAdd((player, sessionId) => {
  console.log('Player joined:', sessionId);
});

room.state.players.onRemove((player, sessionId) => {
  console.log('Player left:', sessionId);
});

// Send input
room.send('move', { x: 1, y: 0 });

// Full state via Colyseus schema sync (auto)
room.onStateChange((state) => {
  syncGameState(state);
});
```

> ❌ Do NOT send full game state every frame over Socket.io — only send *inputs/deltas*
> ✅ Authoritative server: server computes physics/game logic; clients render received state

---

## 12. `[WEB3D]` WebGPU + TSL (Three.js r183+)

> Context7 ID: `/llmstxt/threejs_llms-full_txt` (High, 5,772 snippets) — verified 2026-02-20
> **TSL** = Three.js Shading Language. Write shaders in JS/TS, runs on WebGL AND WebGPU.

### ✅ WebGLRenderer vs WebGPURenderer — when to use which

| Scenario | Use |
| --- | --- |
| Max browser compat, existing examples | `WebGLRenderer` (default) |
| Custom TSL shaders, compute shaders | `WebGPURenderer` |
| Node-based materials (`MeshStandardNodeMaterial`) | `WebGPURenderer` |
| Production game, mobile-first | `WebGLRenderer` (fallback safer) |

> ⚠️ `WebGPURenderer` requires `await renderer.init()` — it's async unlike WebGL
> ⚠️ Chrome 113+ / Firefox 147+ / Safari 26 beta — **not universal yet**, test fallback

### ✅ WebGPURenderer setup (Vanilla Three.js)

```ts
// Import from the WebGPU bundle (includes TSL)
import * as THREE from 'three/webgpu';
import { color, positionLocal, sin, time } from 'three/tsl';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
camera.position.z = 5;

// ✅ WebGPURenderer — async init required
const renderer = new THREE.WebGPURenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(devicePixelRatio);
document.body.appendChild(renderer.domElement);

await renderer.init(); // ← MUST await before render

const controls = new OrbitControls(camera, renderer.domElement);
```

> ❌ Do NOT call `renderer.render()` before `await renderer.init()`
> ❌ Do NOT mix `three/webgpu` and `three` (classic) imports in same file

### ✅ TSL Node Materials (replaces ShaderMaterial + raw GLSL)

```ts
import * as THREE from 'three/webgpu';
import { color, texture, uv, sin, time, positionLocal, normalLocal } from 'three/tsl';

// Animated color node — no GLSL string needed
const material = new THREE.MeshStandardNodeMaterial();

// Dynamic green pulse
material.colorNode = color(0x00ff00).mul(
  sin(time).mul(0.5).add(0.5)
);

// Animated vertex displacement
material.positionNode = positionLocal.add(
  sin(time.add(positionLocal.y)).mul(0.1)
);

// Texture + tint blend
const diffuse = texture(myTexture);
material.colorNode = diffuse.mul(color(0xff4400));
```

> ✅ TSL works on **both** WebGL and WebGPU backends — write once, runs everywhere
> ❌ Old `onBeforeCompile` + GLSL string manipulation = don't use with WebGPU
> ❌ `ShaderMaterial` with raw GLSL still works but can't use TSL node graph

### ✅ WebGLRenderer → WebGPURenderer migration (drop-in swap)

```ts
// BEFORE
import { WebGLRenderer } from 'three';
const renderer = new WebGLRenderer({ antialias: true });
// sync, no init() needed

// AFTER (minimal change)
import * as THREE from 'three/webgpu'; // ← change import
const renderer = new THREE.WebGPURenderer({ antialias: true });
await renderer.init(); // ← add this
// rest of your scene code is unchanged ✅
```

### ✅ Compute Shaders (GPU-side processing)

```ts
import * as THREE from 'three/webgpu';
import { storage, storageObject, Fn, instanceIndex, float } from 'three/tsl';

// GPU buffer
const particleCount = 100_000;
const positionBuffer = new THREE.StorageBufferAttribute(
  new Float32Array(particleCount * 3), 3
);

// Compute kernel — runs on GPU
const computeKernel = Fn(() => {
  const idx = instanceIndex;
  const pos = storageObject(positionBuffer, 'vec3').element(idx);
  // Update position on GPU — zero CPU overhead
  pos.x.assign(pos.x.add(float(0.01)));
})().compute(particleCount);

// Dispatch per frame
renderer.computeAsync(computeKernel);
```

### ✅ R3F + WebGPU (React Three Fiber)

```tsx
// @react-three/fiber v9+ supports WebGPU via gl prop
import { Canvas } from '@react-three/fiber';
import { WebGPURenderer } from 'three/webgpu';

function App() {
  return (
    <Canvas
      gl={(canvas) => {
        const renderer = new WebGPURenderer({ canvas, antialias: true });
        renderer.init(); // fire-and-forget in R3F context
        return renderer;
      }}
    >
      <Scene />
    </Canvas>
  );
}

// TSL material in R3F component
import { MeshStandardNodeMaterial } from 'three/webgpu';
import { color, sin, time } from 'three/tsl';

function PulseMesh() {
  const mat = new MeshStandardNodeMaterial();
  mat.colorNode = color(0x0088ff).mul(sin(time).mul(0.5).add(0.7));
  return (
    <mesh material={mat}>
      <boxGeometry args={[1, 1, 1]} />
    </mesh>
  );
}
```

> ❌ R3F WebGPU support is experimental in v8 — use v9+ or `@react-three/fiber@next`
> ✅ For most R3F projects today: stick with `WebGLRenderer` + `ShaderMaterial`

---

## 13. `[GODOT]` Godot 4.x — GDScript

> Context7 ID: `/websites/godotengine_en_4_5` (High, 53,497 snippets) — verified 2026-02-20
> **Version:** Godot 4.4+ (LTS). GDScript 2.0 with static typing support.

### ✅ Node lifecycle

```gdscript
extends Node

# Called once when node enters scene tree
func _ready() -> void:
    print("Node ready: ", name)

# Called every frame — use for UI, animations, non-physics logic
func _process(delta: float) -> void:
    # delta = seconds since last frame
    rotation += delta * 1.0  # rotate 1 rad/s

# Called at fixed physics step (default 60Hz) — use for movement/physics
func _physics_process(delta: float) -> void:
    pass

# Called for every input event
func _input(event: InputEvent) -> void:
    if event.is_action_pressed("ui_accept"):
        print("Accepted")

# Called when node is freed/removed
func _exit_tree() -> void:
    pass
```

> ❌ Do NOT put physics/movement logic in `_process` — use `_physics_process`
> ❌ Do NOT use `_input` for polling — use `Input.is_action_pressed()` in `_physics_process`

### ✅ Export variables & typed properties

```gdscript
extends CharacterBody3D

# @export makes variable editable in Godot Inspector
@export var speed: float = 5.0
@export var jump_force: float = 8.0
@export var gravity: float = 9.8
@export var bullet_scene: PackedScene  # drag scene into Inspector

# Typed node references
@onready var mesh: MeshInstance3D = $MeshInstance3D
@onready var camera: Camera3D = $Camera3D
@onready var anim: AnimationPlayer = $AnimationPlayer
```

> ✅ `@onready` runs assignment at start of `_ready()` — safe for child node refs
> ❌ Do NOT access `$ChildNode` before `_ready()` — node may not exist yet

### ✅ CharacterBody3D — 3D player movement

```gdscript
extends CharacterBody3D

@export var speed: float = 5.0
@export var jump_velocity: float = 7.0

const GRAVITY := 9.8

func _physics_process(delta: float) -> void:
    # Apply gravity when not on floor
    if not is_on_floor():
        velocity.y -= GRAVITY * delta

    # Jump
    if Input.is_action_just_pressed("jump") and is_on_floor():
        velocity.y = jump_velocity

    # Horizontal movement with camera-relative direction
    var input_dir := Input.get_vector("move_left", "move_right", "move_forward", "move_back")
    var direction := (transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()

    if direction:
        velocity.x = direction.x * speed
        velocity.z = direction.z * speed
    else:
        velocity.x = move_toward(velocity.x, 0, speed)
        velocity.z = move_toward(velocity.z, 0, speed)

    move_and_slide()  # handles collisions automatically
```

### ✅ CharacterBody2D — 2D platformer movement

```gdscript
extends CharacterBody2D

@export var speed: float = 200.0
@export var jump_velocity: float = -400.0

const GRAVITY := 980.0

func _physics_process(delta: float) -> void:
    # Gravity
    if not is_on_floor():
        velocity.y += GRAVITY * delta

    # Jump
    if Input.is_action_just_pressed("ui_accept") and is_on_floor():
        velocity.y = jump_velocity

    # Left/Right
    var direction := Input.get_axis("ui_left", "ui_right")
    velocity.x = direction * speed

    move_and_slide()
```

### ✅ Signals — Godot's event system

```gdscript
# --- Emitter node ---
extends Node

signal health_changed(new_health: int)
signal died

var health: int = 100:
    set(value):
        health = clamp(value, 0, 100)
        health_changed.emit(health)
        if health == 0:
            died.emit()

# --- Receiver node (_ready) ---
func _ready() -> void:
    # Connect via code
    $Enemy.health_changed.connect(_on_health_changed)
    $Enemy.died.connect(_on_enemy_died)

func _on_health_changed(new_health: int) -> void:
    $HealthBar.value = new_health

func _on_enemy_died() -> void:
    queue_free()  # remove from scene
```

> ✅ Prefer connecting signals in `_ready()` via code for type safety
> ✅ Use `signal_name.emit(args)` — NOT `emit_signal("string_name")`

### ✅ Area2D / Area3D — trigger zones

```gdscript
extends Area2D

func _ready() -> void:
    body_entered.connect(_on_body_entered)
    body_exited.connect(_on_body_exited)

func _on_body_entered(body: Node2D) -> void:
    if body.is_in_group("player"):
        print("Player entered zone")

func _on_body_exited(body: Node2D) -> void:
    print("Body left zone: ", body.name)
```

### ✅ Scene instancing (spawning)

```gdscript
extends Node

@export var enemy_scene: PackedScene

func spawn_enemy(pos: Vector3) -> void:
    var enemy: CharacterBody3D = enemy_scene.instantiate()
    add_child(enemy)
    enemy.global_position = pos

# Preload at script load time (faster)
const BULLET = preload("res://scenes/bullet.tscn")

func fire() -> void:
    var bullet = BULLET.instantiate()
    get_tree().current_scene.add_child(bullet)
    bullet.global_position = $Muzzle.global_position
    bullet.direction = -transform.basis.z  # forward
```

### ✅ Groups — tag-based querying

```gdscript
# In Inspector: add node to group "enemies"
# Or via code:
func _ready() -> void:
    add_to_group("enemies")

# Query all enemies from anywhere
func damage_all_enemies(amount: int) -> void:
    for enemy in get_tree().get_nodes_in_group("enemies"):
        enemy.take_damage(amount)
```

### ✅ Autoload (Singleton) — global state

```gdscript
# Project Settings → Autoload → Add GameManager.gd as "GameManager"

# GameManager.gd
extends Node

var score: int = 0
var lives: int = 3

signal score_updated(new_score: int)

func add_score(points: int) -> void:
    score += points
    score_updated.emit(score)

# Access from any script
GameManager.add_score(100)
GameManager.score_updated.connect(_on_score_updated)
```

### ✅ Godot vs Unity vs Unreal — choosing an engine

| Criteria | Godot 4 | Unity 6 | Unreal 5 |
| --- | --- | --- | --- |
| License | Free, open source | Free tier / Runtime fee (⚠️) | Free, 5% royalty > $1M |
| Language | GDScript, C# | C# | C++, Blueprints |
| 2D support | ⭐⭐⭐⭐⭐ Native 2D | ⭐⭐⭐ (bolt-on) | ⭐⭐ (Paper2D) |
| 3D quality | ⭐⭐⭐ Good | ⭐⭐⭐⭐ Great | ⭐⭐⭐⭐⭐ Industry-grade |
| Mobile perf | ✅ Excellent | ✅ Good | ⚠️ Heavy |
| Bundle size | Small (~40MB) | Medium | Large |
| Learning curve | Low | Medium | High |
| Best for | Indies, 2D, prototypes | Mid-size cross-platform | AAA, photorealistic 3D |
