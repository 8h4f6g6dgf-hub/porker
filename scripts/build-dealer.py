"""Build CC0 Quaternius male into a texture-free skinned dealer GLB.
Usage: python3 scripts/build-dealer.py /path/to/Godot-UE
No Blender/additional Python packages required. Original topology/weights retained.
"""
import sys,json,struct,pathlib,copy,hashlib,math
source=pathlib.Path(sys.argv[1]);g=json.loads((source/'Superhero_Male_FullBody.gltf').read_text());raw=(source/'Superhero_Male_FullBody.bin').read_bytes()
print('source sha256',hashlib.sha256(raw).hexdigest())
def read(i):
 a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];n={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[a['type']];f={5126:'f',5123:'H',5121:'B'}[a['componentType']];stride=v.get('byteStride',struct.calcsize(f)*n);start=v.get('byteOffset',0)+a.get('byteOffset',0)
 return [struct.unpack_from('<'+f*n,raw,start+j*stride) for j in range(a['count'])]
blob=bytearray();views=[];access=[]
def put(data,kind,component=5126):
 while len(blob)%4:blob.append(0)
 start=len(blob);f={5126:'f',5123:'H',5121:'B'}[component]
 for row in data:blob.extend(struct.pack('<'+f*len(row),*row))
 views.append({'buffer':0,'byteOffset':start,'byteLength':len(blob)-start});a={'bufferView':len(views)-1,'componentType':component,'count':len(data),'type':kind}
 if kind=='VEC3':a.update(min=[min(r[i] for r in data) for i in range(3)],max=[max(r[i] for r in data) for i in range(3)])
 access.append(a);return len(access)-1
p=read(23);normal=read(24);joints=read(29);weights=read(30);indices=read(31)
# Proportion refinement in bind space; the 65-bone hierarchy and weights stay intact.
# Compress muscle cross-sections around the original arm centreline, not the whole model.
bone_names=[g['nodes'][i]['name'] for i in g['skins'][0]['joints']]
reshaped=[]
for (x,y,z),js,ws in zip(p,joints,weights):
 arm=sum(w for j,w in zip(js,ws) if bone_names[j].startswith(('upperarm','lowerarm')))
 torso=max(0,1-arm)*max(0,min(1,(y-1.0)/.2))*max(0,min(1,(1.56-y)/.08)) if abs(x)<.25 else 0
 radius=.64/1.10 if abs(x)<.46 else .62/(1.10*1.03)
 centre_z=-.065-.008*max(0,1-abs(abs(x)-.463)/.251)
 reshaped.append((x*(1-(.08+.07*math.exp(-((y-1.16)/.13)**2))*torso),y+(1.455-y)*(1-radius)*arm,z+(centre_z-z)*(1-radius)*arm-z*.25*torso))
p=reshaped
# Recompute normals after reshaping, keeping the original vertex topology.
acc=[[0.,0.,0.] for _ in p]
for t in range(0,len(indices),3):
 a,b,c=[indices[t+i][0] for i in range(3)]
 u=[p[b][k]-p[a][k] for k in range(3)];v=[p[c][k]-p[a][k] for k in range(3)]
 n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]]
 for i in [a,b,c]:acc[i]=[acc[i][k]+n[k] for k in range(3)]
normal=[tuple(v/math.sqrt(sum(q*q for q in row)) for v in row) if sum(q*q for q in row)>1e-20 else old for row,old in zip(acc,normal)]
def linear(c):return ((c+.055)/1.055)**2.4 if c>.04045 else c/12.92
colors=[];newp=[]
for (x,y,z),n in zip(p,normal):
 if y<1.00:c=(.055,.06,.065)
 elif y>1.61 and abs(x)<.13:c=(.07,.065,.06)
 elif abs(x)>.68:c=(.58,.40,.29)
 elif y>1.51 and abs(x)<.085:c=(.42,.29,.20)
 elif .96<y<1.23 and abs(x)<.175:c=(.065,.07,.075)
 else:c=(.88,.88,.84)
 # Slight cloth ease removes skin-tight muscle highlights while retaining sewn continuity.
 ease=.004 if c[0]>.8 else .004 if y>1.0 and abs(x)<.235 and y<1.47 else 0
 newp.append((x+n[0]*ease,y+n[1]*ease,z+n[2]*ease));colors.append(tuple(linear(v) for v in c))
attrs={'POSITION':put(newp,'VEC3'),'NORMAL':put(normal,'VEC3'),'COLOR_0':put(colors,'VEC3'),'JOINTS_0':put(joints,'VEC4',5121),'WEIGHTS_0':put(weights,'VEC4')}
prim={'attributes':attrs,'indices':put(indices,'SCALAR',5123),'material':0}
nodes=copy.deepcopy(g['nodes']);nodes[68]['children']=[67,64];nodes[67]['mesh']=0
for i in [65,66]:nodes[i].pop('mesh',None);nodes[i].pop('skin',None)
skin=copy.deepcopy(g['skins'][0]);skin['inverseBindMatrices']=put(read(skin['inverseBindMatrices']),'MAT4')
# Fitted waistcoat shell: continuous curved panels with a real V opening.
# Garment weights are sampled from the nearest source body vertex.
vp=[];vn=[];vc=[];vj=[];vw=[];vi=[]
def vertex(pos,color,normal=(0,0,1)):
 x,y,offset=pos
 # Project garment details onto the actual front chest and interpolate its skin.
 hits=[]
 for t in range(0,len(indices),3):
  ids=[indices[t+k][0] for k in range(3)];a,b,c=[p[i] for i in ids]
  den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
  if abs(den)<1e-10:continue
  u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/den
  v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/den
  bary=[u,v,1-u-v]
  if min(bary)>=-1e-6:hits.append((sum(bary[k]*p[i][2] for k,i in enumerate(ids)),ids,bary))
 z,ids,bary=max(hits,key=lambda h:h[0])
 w=[0.0]*65
 for i,f in zip(ids,bary):
  for j,value in zip(joints[i],weights[i]):w[j]+=value*f
 top=sorted(range(65),key=lambda j:w[j],reverse=True)[:4];total=sum(w[j] for j in top)
 vp.append((x,y,z+offset));vn.append(normal);vc.append(tuple(linear(v) for v in color));vj.append(top);vw.append([w[j]/total for j in top]);return len(vp)-1
def patch(rows,color):
 # Subdivide before surface projection so the cloth cannot bridge through the chest.
 refined=[]
 for a,b in zip(rows,rows[1:]):
  steps=max(2,math.ceil(abs(a[0][1]-b[0][1])/.012))
  for k in range(steps):
   t=k/steps
   edges=[tuple(a[j][i]*(1-t)+b[j][i]*t for i in range(3)) for j in range(2)]
   refined.append([tuple(edges[0][i]*(1-u/4)+edges[1][i]*(u/4) for i in range(3)) for u in range(5)])
 refined.append([tuple(rows[-1][0][i]*(1-u/4)+rows[-1][1][i]*(u/4) for i in range(3)) for u in range(5)])
 ids=[[vertex(pos,color) for pos in row] for row in refined]
 for i in range(len(ids)-1):
  for j in range(len(ids[0])-1):
   a,b,c,d=ids[i][j],ids[i][j+1],ids[i+1][j],ids[i+1][j+1];vi.extend([a,c,b,b,c,d])
black=(.065,.07,.075)
# Clip the actual torso surface at garment seams instead of intersecting a
# generic shell with the body. Interpolated skin weights preserve every seam.
def mix(a,b,t):return [[x+(y-x)*t for x,y in zip(av,bv)] for av,bv in zip(a,b)]
def clip(poly,plane):
 result=[]
 for a,b in zip(poly,poly[1:]+poly[:1]):
  da=plane(a[0]);db=plane(b[0])
  if da>=0:result.append(a)
  if (da>=0)!=(db>=0):result.append(mix(a,b,da/(da-db)))
 return result
# Dense weight vectors allow exact interpolation along newly cut edges.
dense=[]
for js,ws in zip(joints,weights):
 row=[0.0]*65
 for j,w in zip(js,ws):row[j]+=w
 dense.append(row)
for side in [-1,1]:
 for front in [True,False]:
  planes=[lambda q:q[1]-.96,lambda q:1.55-q[1],lambda q:.195-abs(q[0]),lambda q,side=side:side*q[0],lambda q,front=front:(q[2]+.025) if front else -.025-q[2]]
  if front:planes.append(lambda q,side=side:side*q[0]-(q[1]-1.255)*.32)
  for tri in range(0,len(indices),3):
   poly=[[list(p[i]),list(normal[i]),dense[i]] for (i,) in indices[tri:tri+3]]
   for plane in planes:
    if not poly:break
    poly=clip(poly,plane)
   if len(poly)<3:continue
   ids=[]
   for pos,n,w in poly:
    ids.append(len(vp));vp.append(tuple(pos[k]+n[k]*.018 for k in range(3)));vn.append(n);vc.append(tuple(linear(v) for v in black))
    top=sorted(range(65),key=lambda j:w[j],reverse=True)[:4];total=sum(w[j] for j in top);vj.append(top);vw.append([w[j]/total for j in top])
   for i in range(1,len(ids)-1):vi.extend([ids[0],ids[i],ids[i+1]])
# Surface-conforming collar leaves and a tapered tie with a compact knot.
patch([[(-.013,1.525,.024),(.013,1.525,.024)],[(-.019,1.495,.024),(.019,1.495,.024)],[(-.013,1.475,.024),(.013,1.475,.024)],[(-.021,1.325,.024),(.021,1.325,.024)],[(0,1.24,.024),(0,1.24,.024)]],(.025,.028,.03))
for sign in [-1,1]:
 patch([[(sign*.018,1.535,.027),(sign*.072,1.54,.027)],[(sign*.047,1.475,.030),(sign*.10,1.50,.027)]],(.93,.93,.89))
# Small dark horn buttons, with a subtle rim; no separate rigid objects.
for height in [1.235,1.145,1.055]:
 centre=vertex((0,height,.026),(.10,.105,.105))
 ring=[vertex((.009*math.cos(i*math.tau/12),height+.009*math.sin(i*math.tau/12),.025),(.12,.125,.12)) for i in range(12)]
 for i in range(12):vi.extend([centre,ring[i],ring[(i+1)%12]])
# Mirrored collar leaves must both face outwards; double-sided materials otherwise
# invert one leaf's lighting and make it appear as a dark overlapping polygon.
for t in range(0,len(vi),3):
 a,b,c=vi[t:t+3];u=[vp[b][k]-vp[a][k] for k in range(3)];v=[vp[c][k]-vp[a][k] for k in range(3)]
 cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]]
 if sum(cross[k]*(vn[a][k]+vn[b][k]+vn[c][k]) for k in range(3))<0:vi[t+1],vi[t+2]=vi[t+2],vi[t+1]
cloth={'attributes':{'POSITION':put(vp,'VEC3'),'NORMAL':put(vn,'VEC3'),'COLOR_0':put(vc,'VEC3'),'JOINTS_0':put(vj,'VEC4',5121),'WEIGHTS_0':put(vw,'VEC4')},'indices':put([(i,) for i in vi],'SCALAR',5123),'material':0}
out={'asset':{'version':'2.0','generator':'Poker Academy CC0 dealer adaptation'},'scene':0,'scenes':[{'nodes':[68]}],'nodes':nodes,'skins':[skin],'meshes':[{'name':'Dealer_Skinned','primitives':[prim,cloth]}],'materials':[{'name':'Dealer_matte','pbrMetallicRoughness':{'baseColorFactor':[1,1,1,1],'metallicFactor':0,'roughnessFactor':.9},'doubleSided':True}],'buffers':[{'byteLength':len(blob)}],'bufferViews':views,'accessors':access}
js=json.dumps(out,separators=(',',':')).encode();js+=b' '*((-len(js))%4);blob+=b'\0'*((-len(blob))%4)
data=struct.pack('<III',0x46546c67,2,12+8+len(js)+8+len(blob))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(blob),0x004e4942)+blob
path=pathlib.Path('public/assets/dealer/dealer.glb');path.write_bytes(data);print(path,len(data),'bytes',len(indices)//3,'body triangles',len(skin['joints']),'bones')
