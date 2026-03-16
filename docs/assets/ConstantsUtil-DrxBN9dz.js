import{t as e}from"./formatUnits-BCcqqn0L.js";import{l as t,u as n}from"./lit-8oBG13LT.js";var r=Symbol(),i=Symbol(),a=`a`,o=`w`,s=(e,t)=>new Proxy(e,t),c=Object.getPrototypeOf,l=new WeakMap,u=e=>e&&(l.has(e)?l.get(e):c(e)===Object.prototype||c(e)===Array.prototype),d=e=>typeof e==`object`&&!!e,f=e=>{if(Array.isArray(e))return Array.from(e);let t=Object.getOwnPropertyDescriptors(e);return Object.values(t).forEach(e=>{e.configurable=!0}),Object.create(c(e),t)},ee=e=>e[i]||e,te=(e,t,n,c)=>{if(!u(e))return e;let l=c&&c.get(e);if(!l){let t=ee(e);l=(e=>Object.values(Object.getOwnPropertyDescriptors(e)).some(e=>!e.configurable&&!e.writable))(t)?[t,f(t)]:[t],c?.set(e,l)}let[d,p]=l,m=n&&n.get(d);return m&&m[1].f===!!p||(m=((e,t)=>{let n={f:t},s=!1,c=(t,r)=>{if(!s){let i=n[a].get(e);if(i||(i={},n[a].set(e,i)),t===o)i[o]=!0;else{let e=i[t];e||(e=new Set,i[t]=e),e.add(r)}}},l={get:(t,r)=>r===i?e:(c(`k`,r),te(Reflect.get(t,r),n[a],n.c,n.t)),has:(t,i)=>i===r?(s=!0,n[a].delete(e),!0):(c(`h`,i),Reflect.has(t,i)),getOwnPropertyDescriptor:(e,t)=>(c(`o`,t),Reflect.getOwnPropertyDescriptor(e,t)),ownKeys:e=>(c(o),Reflect.ownKeys(e))};return t&&(l.set=l.deleteProperty=()=>!1),[l,n]})(d,!!p),m[1].p=s(p||d,m[0]),n&&n.set(d,m)),m[1][a]=t,m[1].c=n,m[1].t=c,m[1].p},p=(e,t,n,r,i=Object.is)=>{if(i(e,t))return!1;if(!d(e)||!d(t))return!0;let a=n.get(ee(e));if(!a)return!0;if(r){let n=r.get(e);if(n&&n.n===t)return n.g;r.set(e,{n:t,g:!1})}let s=null;try{for(let n of a.h||[])if(s=Reflect.has(e,n)!==Reflect.has(t,n),s)return s;if(!0===a[o]){if(s=((e,t)=>{let n=Reflect.ownKeys(e),r=Reflect.ownKeys(t);return n.length!==r.length||n.some((e,t)=>e!==r[t])})(e,t),s)return s}else for(let n of a.o||[])if(s=!!Reflect.getOwnPropertyDescriptor(e,n)!=!!Reflect.getOwnPropertyDescriptor(t,n),s)return s;for(let o of a.k||[])if(s=p(e[o],t[o],n,r,i),s)return s;return s===null&&(s=!0),s}finally{r&&r.set(e,{n:t,g:s})}},m=e=>u(e)&&e[i]||null,ne=(e,t=!0)=>{l.set(e,t)},re=e=>typeof e==`object`&&!!e,h=new WeakMap,g=new WeakSet,[ie]=((e=Object.is,t=(e,t)=>new Proxy(e,t),n=e=>re(e)&&!g.has(e)&&(Array.isArray(e)||!(Symbol.iterator in e))&&!(e instanceof WeakMap)&&!(e instanceof WeakSet)&&!(e instanceof Error)&&!(e instanceof Number)&&!(e instanceof Date)&&!(e instanceof String)&&!(e instanceof RegExp)&&!(e instanceof ArrayBuffer),r=e=>{switch(e.status){case`fulfilled`:return e.value;case`rejected`:throw e.reason;default:throw e}},i=new WeakMap,a=(e,t,n=r)=>{let o=i.get(e);if(o?.[0]===t)return o[1];let s=Array.isArray(e)?[]:Object.create(Object.getPrototypeOf(e));return ne(s,!0),i.set(e,[t,s]),Reflect.ownKeys(e).forEach(t=>{if(Object.getOwnPropertyDescriptor(s,t))return;let r=Reflect.get(e,t),{enumerable:i}=Reflect.getOwnPropertyDescriptor(e,t),o={value:r,enumerable:i,configurable:!0};if(g.has(r))ne(r,!1);else if(r instanceof Promise)delete o.value,o.get=()=>n(r);else if(h.has(r)){let[e,t]=h.get(r);o.value=a(e,t(),n)}Object.defineProperty(s,t,o)}),Object.preventExtensions(s)},o=new WeakMap,s=[1,1],c=r=>{if(!re(r))throw Error(`object required`);let i=o.get(r);if(i)return i;let l=s[0],u=new Set,d=(e,t=++s[0])=>{l!==t&&(l=t,u.forEach(n=>n(e,t)))},f=s[1],ee=(e=++s[1])=>(f!==e&&!u.size&&(f=e,p.forEach(([t])=>{let n=t[1](e);n>l&&(l=n)})),l),te=e=>(t,n)=>{let r=[...t];r[1]=[e,...r[1]],d(r,n)},p=new Map,ne=(e,t)=>{if(u.size){let n=t[3](te(e));p.set(e,[t,n])}else p.set(e,[t])},ie=e=>{var t;let n=p.get(e);n&&(p.delete(e),(t=n[1])==null||t.call(n))},_=e=>(u.add(e),u.size===1&&p.forEach(([e,t],n)=>{let r=e[3](te(n));p.set(n,[e,r])}),()=>{u.delete(e),u.size===0&&p.forEach(([e,t],n)=>{t&&(t(),p.set(n,[e]))})}),v=Array.isArray(r)?[]:Object.create(Object.getPrototypeOf(r)),ae=t(v,{deleteProperty(e,t){let n=Reflect.get(e,t);ie(t);let r=Reflect.deleteProperty(e,t);return r&&d([`delete`,[t],n]),r},set(t,r,i,a){let s=Reflect.has(t,r),l=Reflect.get(t,r,a);if(s&&(e(l,i)||o.has(i)&&e(l,o.get(i))))return!0;ie(r),re(i)&&(i=m(i)||i);let u=i;if(i instanceof Promise)i.then(e=>{i.status=`fulfilled`,i.value=e,d([`resolve`,[r],e])}).catch(e=>{i.status=`rejected`,i.reason=e,d([`reject`,[r],e])});else{!h.has(i)&&n(i)&&(u=c(i));let e=!g.has(u)&&h.get(u);e&&ne(r,e)}return Reflect.set(t,r,u,a),d([`set`,[r],i,l]),!0}});o.set(r,ae);let oe=[v,ee,a,_];return h.set(ae,oe),Reflect.ownKeys(r).forEach(e=>{let t=Object.getOwnPropertyDescriptor(r,e);`value`in t&&(ae[e]=r[e],delete t.value,delete t.writable),Object.defineProperty(v,e,t)}),ae})=>[c,h,g,e,t,n,r,i,a,o,s])();function _(e={}){return ie(e)}function v(e,t,n){let r=h.get(e),i,a=[],o=r[3],s=!1,c=o(e=>{if(a.push(e),n){t(a.splice(0));return}i||=Promise.resolve().then(()=>{i=void 0,s&&t(a.splice(0))})});return s=!0,()=>{s=!1,c()}}function ae(e,t){let[n,r,i]=h.get(e);return i(n,r(),t)}function oe(e){return g.add(e),e}function y(e,t,n,r){let i=e[t];return v(e,()=>{let r=e[t];Object.is(i,r)||n(i=r)},r)}function se(e){let t=_({data:Array.from(e||[]),has(e){return this.data.some(t=>t[0]===e)},set(e,t){let n=this.data.find(t=>t[0]===e);return n?n[1]=t:this.data.push([e,t]),this},get(e){return this.data.find(t=>t[0]===e)?.[1]},delete(e){let t=this.data.findIndex(t=>t[0]===e);return t===-1?!1:(this.data.splice(t,1),!0)},clear(){this.data.splice(0)},get size(){return this.data.length},toJSON(){return new Map(this.data)},forEach(e){this.data.forEach(t=>{e(t[1],t[0],this)})},keys(){return this.data.map(e=>e[0]).values()},values(){return this.data.map(e=>e[1]).values()},entries(){return new Map(this.data).entries()},get[Symbol.toStringTag](){return`Map`},[Symbol.iterator](){return this.entries()}});return Object.defineProperties(t,{data:{enumerable:!1},size:{enumerable:!1},toJSON:{enumerable:!1}}),Object.seal(t),t}var b={WC_NAME_SUFFIX:`.reown.id`,WC_NAME_SUFFIX_LEGACY:`.wcn.id`,BLOCKCHAIN_API_RPC_URL:`https://rpc.walletconnect.org`,PULSE_API_URL:`https://pulse.walletconnect.org`,W3M_API_URL:`https://api.web3modal.org`,CONNECTOR_ID:{WALLET_CONNECT:`walletConnect`,INJECTED:`injected`,WALLET_STANDARD:`announced`,COINBASE:`coinbaseWallet`,COINBASE_SDK:`coinbaseWalletSDK`,SAFE:`safe`,LEDGER:`ledger`,OKX:`okx`,EIP6963:`eip6963`,AUTH:`ID_AUTH`},CONNECTOR_NAMES:{AUTH:`Auth`},AUTH_CONNECTOR_SUPPORTED_CHAINS:[`eip155`,`solana`],LIMITS:{PENDING_TRANSACTIONS:99},CHAIN:{EVM:`eip155`,SOLANA:`solana`,POLKADOT:`polkadot`,BITCOIN:`bip122`},CHAIN_NAME_MAP:{eip155:`EVM Networks`,solana:`Solana`,polkadot:`Polkadot`,bip122:`Bitcoin`,cosmos:`Cosmos`},ADAPTER_TYPES:{BITCOIN:`bitcoin`,SOLANA:`solana`,WAGMI:`wagmi`,ETHERS:`ethers`,ETHERS5:`ethers5`},USDT_CONTRACT_ADDRESSES:[`0xdac17f958d2ee523a2206206994597c13d831ec7`,`0xc2132d05d31c914a87c6611c10748aeb04b58e8f`,`0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7`,`0x919C1c267BC06a7039e03fcc2eF738525769109c`,`0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e`,`0x55d398326f99059fF775485246999027B3197955`,`0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9`],HTTP_STATUS_CODES:{SERVICE_UNAVAILABLE:503,FORBIDDEN:403},UNSUPPORTED_NETWORK_NAME:`Unknown Network`,SECURE_SITE_SDK_ORIGIN:(typeof process<`u`?{}.NEXT_PUBLIC_SECURE_SITE_ORIGIN:void 0)||`https://secure.walletconnect.org`},ce={caipNetworkIdToNumber(e){return e?Number(e.split(`:`)[1]):void 0},parseEvmChainId(e){return typeof e==`string`?this.caipNetworkIdToNumber(e):e},getNetworksByNamespace(e,t){return e?.filter(e=>e.chainNamespace===t)||[]},getFirstNetworkByNamespace(e,t){return this.getNetworksByNamespace(e,t)[0]},getNetworkNameByCaipNetworkId(e,t){if(!t)return;let n=e.find(e=>e.caipNetworkId===t);if(n)return n.name;let[r]=t.split(`:`);return b.CHAIN_NAME_MAP?.[r]||void 0}},le=20,ue=1,de=1e6,fe=1e6,pe=-7,me=21,he=!1,ge=`[big.js] `,_e=ge+`Invalid `,ve=_e+`decimal places`,ye=_e+`rounding mode`,be=ge+`Division by zero`,x={},xe=void 0,Se=/^-?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;function Ce(){function e(t){var n=this;if(!(n instanceof e))return t===xe?Ce():new e(t);if(t instanceof e)n.s=t.s,n.e=t.e,n.c=t.c.slice();else{if(typeof t!=`string`){if(e.strict===!0&&typeof t!=`bigint`)throw TypeError(_e+`value`);t=t===0&&1/t<0?`-0`:String(t)}we(n,t)}n.constructor=e}return e.prototype=x,e.DP=le,e.RM=ue,e.NE=pe,e.PE=me,e.strict=he,e.roundDown=0,e.roundHalfUp=1,e.roundHalfEven=2,e.roundUp=3,e}function we(e,t){var n,r,i;if(!Se.test(t))throw Error(_e+`number`);for(e.s=t.charAt(0)==`-`?(t=t.slice(1),-1):1,(n=t.indexOf(`.`))>-1&&(t=t.replace(`.`,``)),(r=t.search(/e/i))>0?(n<0&&(n=r),n+=+t.slice(r+1),t=t.substring(0,r)):n<0&&(n=t.length),i=t.length,r=0;r<i&&t.charAt(r)==`0`;)++r;if(r==i)e.c=[e.e=0];else{for(;i>0&&t.charAt(--i)==`0`;);for(e.e=n-r-1,e.c=[],n=0;r<=i;)e.c[n++]=+t.charAt(r++)}return e}function Te(e,t,n,r){var i=e.c;if(n===xe&&(n=e.constructor.RM),n!==0&&n!==1&&n!==2&&n!==3)throw Error(ye);if(t<1)r=n===3&&(r||!!i[0])||t===0&&(n===1&&i[0]>=5||n===2&&(i[0]>5||i[0]===5&&(r||i[1]!==xe))),i.length=1,r?(e.e=e.e-t+1,i[0]=1):i[0]=e.e=0;else if(t<i.length){if(r=n===1&&i[t]>=5||n===2&&(i[t]>5||i[t]===5&&(r||i[t+1]!==xe||i[t-1]&1))||n===3&&(r||!!i[0]),i.length=t,r){for(;++i[--t]>9;)if(i[t]=0,t===0){++e.e,i.unshift(1);break}}for(t=i.length;!i[--t];)i.pop()}return e}function Ee(e,t,n){var r=e.e,i=e.c.join(``),a=i.length;if(t)i=i.charAt(0)+(a>1?`.`+i.slice(1):``)+(r<0?`e`:`e+`)+r;else if(r<0){for(;++r;)i=`0`+i;i=`0.`+i}else if(r>0)if(++r>a)for(r-=a;r--;)i+=`0`;else r<a&&(i=i.slice(0,r)+`.`+i.slice(r));else a>1&&(i=i.charAt(0)+`.`+i.slice(1));return e.s<0&&n?`-`+i:i}x.abs=function(){var e=new this.constructor(this);return e.s=1,e},x.cmp=function(e){var t,n=this,r=n.c,i=(e=new n.constructor(e)).c,a=n.s,o=e.s,s=n.e,c=e.e;if(!r[0]||!i[0])return r[0]?a:i[0]?-o:0;if(a!=o)return a;if(t=a<0,s!=c)return s>c^t?1:-1;for(o=(s=r.length)<(c=i.length)?s:c,a=-1;++a<o;)if(r[a]!=i[a])return r[a]>i[a]^t?1:-1;return s==c?0:s>c^t?1:-1},x.div=function(e){var t=this,n=t.constructor,r=t.c,i=(e=new n(e)).c,a=t.s==e.s?1:-1,o=n.DP;if(o!==~~o||o<0||o>de)throw Error(ve);if(!i[0])throw Error(be);if(!r[0])return e.s=a,e.c=[e.e=0],e;var s,c,l,u,d,f=i.slice(),ee=s=i.length,te=r.length,p=r.slice(0,s),m=p.length,ne=e,re=ne.c=[],h=0,g=o+(ne.e=t.e-e.e)+1;for(ne.s=a,a=g<0?0:g,f.unshift(0);m++<s;)p.push(0);do{for(l=0;l<10;l++){if(s!=(m=p.length))u=s>m?1:-1;else for(d=-1,u=0;++d<s;)if(i[d]!=p[d]){u=i[d]>p[d]?1:-1;break}if(u<0){for(c=m==s?i:f;m;){if(p[--m]<c[m]){for(d=m;d&&!p[--d];)p[d]=9;--p[d],p[m]+=10}p[m]-=c[m]}for(;!p[0];)p.shift()}else break}re[h++]=u?l:++l,p[0]&&u?p[m]=r[ee]||0:p=[r[ee]]}while((ee++<te||p[0]!==xe)&&a--);return!re[0]&&h!=1&&(re.shift(),ne.e--,g--),h>g&&Te(ne,g,n.RM,p[0]!==xe),ne},x.eq=function(e){return this.cmp(e)===0},x.gt=function(e){return this.cmp(e)>0},x.gte=function(e){return this.cmp(e)>-1},x.lt=function(e){return this.cmp(e)<0},x.lte=function(e){return this.cmp(e)<1},x.minus=x.sub=function(e){var t,n,r,i,a=this,o=a.constructor,s=a.s,c=(e=new o(e)).s;if(s!=c)return e.s=-c,a.plus(e);var l=a.c.slice(),u=a.e,d=e.c,f=e.e;if(!l[0]||!d[0])return d[0]?e.s=-c:l[0]?e=new o(a):e.s=1,e;if(s=u-f){for((i=s<0)?(s=-s,r=l):(f=u,r=d),r.reverse(),c=s;c--;)r.push(0);r.reverse()}else for(n=((i=l.length<d.length)?l:d).length,s=c=0;c<n;c++)if(l[c]!=d[c]){i=l[c]<d[c];break}if(i&&(r=l,l=d,d=r,e.s=-e.s),(c=(n=d.length)-(t=l.length))>0)for(;c--;)l[t++]=0;for(c=t;n>s;){if(l[--n]<d[n]){for(t=n;t&&!l[--t];)l[t]=9;--l[t],l[n]+=10}l[n]-=d[n]}for(;l[--c]===0;)l.pop();for(;l[0]===0;)l.shift(),--f;return l[0]||(e.s=1,l=[f=0]),e.c=l,e.e=f,e},x.mod=function(e){var t,n=this,r=n.constructor,i=n.s,a=(e=new r(e)).s;if(!e.c[0])throw Error(be);return n.s=e.s=1,t=e.cmp(n)==1,n.s=i,e.s=a,t?new r(n):(i=r.DP,a=r.RM,r.DP=r.RM=0,n=n.div(e),r.DP=i,r.RM=a,this.minus(n.times(e)))},x.neg=function(){var e=new this.constructor(this);return e.s=-e.s,e},x.plus=x.add=function(e){var t,n,r,i=this,a=i.constructor;if(e=new a(e),i.s!=e.s)return e.s=-e.s,i.minus(e);var o=i.e,s=i.c,c=e.e,l=e.c;if(!s[0]||!l[0])return l[0]||(s[0]?e=new a(i):e.s=i.s),e;if(s=s.slice(),t=o-c){for(t>0?(c=o,r=l):(t=-t,r=s),r.reverse();t--;)r.push(0);r.reverse()}for(s.length-l.length<0&&(r=l,l=s,s=r),t=l.length,n=0;t;s[t]%=10)n=(s[--t]=s[t]+l[t]+n)/10|0;for(n&&(s.unshift(n),++c),t=s.length;s[--t]===0;)s.pop();return e.c=s,e.e=c,e},x.pow=function(e){var t=this,n=new t.constructor(`1`),r=n,i=e<0;if(e!==~~e||e<-fe||e>fe)throw Error(_e+`exponent`);for(i&&(e=-e);e&1&&(r=r.times(t)),e>>=1,e;)t=t.times(t);return i?n.div(r):r},x.prec=function(e,t){if(e!==~~e||e<1||e>de)throw Error(_e+`precision`);return Te(new this.constructor(this),e,t)},x.round=function(e,t){if(e===xe)e=0;else if(e!==~~e||e<-de||e>de)throw Error(ve);return Te(new this.constructor(this),e+this.e+1,t)},x.sqrt=function(){var e,t,n,r=this,i=r.constructor,a=r.s,o=r.e,s=new i(`0.5`);if(!r.c[0])return new i(r);if(a<0)throw Error(ge+`No square root`);a=Math.sqrt(+Ee(r,!0,!0)),a===0||a===1/0?(t=r.c.join(``),t.length+o&1||(t+=`0`),a=Math.sqrt(t),o=((o+1)/2|0)-(o<0||o&1),e=new i((a==1/0?`5e`:(a=a.toExponential()).slice(0,a.indexOf(`e`)+1))+o)):e=new i(a+``),o=e.e+(i.DP+=4);do n=e,e=s.times(n.plus(r.div(n)));while(n.c.slice(0,o).join(``)!==e.c.slice(0,o).join(``));return Te(e,(i.DP-=4)+e.e+1,i.RM)},x.times=x.mul=function(e){var t,n=this,r=n.constructor,i=n.c,a=(e=new r(e)).c,o=i.length,s=a.length,c=n.e,l=e.e;if(e.s=n.s==e.s?1:-1,!i[0]||!a[0])return e.c=[e.e=0],e;for(e.e=c+l,o<s&&(t=i,i=a,a=t,l=o,o=s,s=l),t=Array(l=o+s);l--;)t[l]=0;for(c=s;c--;){for(s=0,l=o+c;l>c;)s=t[l]+a[c]*i[l-c-1]+s,t[l--]=s%10,s=s/10|0;t[l]=s}for(s?++e.e:t.shift(),c=t.length;!t[--c];)t.pop();return e.c=t,e},x.toExponential=function(e,t){var n=this,r=n.c[0];if(e!==xe){if(e!==~~e||e<0||e>de)throw Error(ve);for(n=Te(new n.constructor(n),++e,t);n.c.length<e;)n.c.push(0)}return Ee(n,!0,!!r)},x.toFixed=function(e,t){var n=this,r=n.c[0];if(e!==xe){if(e!==~~e||e<0||e>de)throw Error(ve);for(n=Te(new n.constructor(n),e+n.e+1,t),e=e+n.e+1;n.c.length<e;)n.c.push(0)}return Ee(n,!1,!!r)},x[Symbol.for(`nodejs.util.inspect.custom`)]=x.toJSON=x.toString=function(){var e=this,t=e.constructor;return Ee(e,e.e<=t.NE||e.e>=t.PE,!!e.c[0])},x.toNumber=function(){var e=+Ee(this,!0,!0);if(this.constructor.strict===!0&&!this.eq(e.toString()))throw Error(ge+`Imprecise conversion`);return e},x.toPrecision=function(e,t){var n=this,r=n.constructor,i=n.c[0];if(e!==xe){if(e!==~~e||e<1||e>de)throw Error(_e+`precision`);for(n=Te(new r(n),e,t);n.c.length<e;)n.c.push(0)}return Ee(n,e<=n.e||n.e<=r.NE||n.e>=r.PE,!!i)},x.valueOf=function(){var e=this,t=e.constructor;if(t.strict===!0)throw Error(ge+`valueOf disallowed`);return Ee(e,e.e<=t.NE||e.e>=t.PE,!0)};var De=Ce(),Oe={bigNumber(e){return e?new De(e):new De(0)},multiply(e,t){if(e===void 0||t===void 0)return new De(0);let n=new De(e),r=new De(t);return n.times(r)},formatNumberToLocalString(e,t=2){return e===void 0?`0.00`:typeof e==`number`?e.toLocaleString(`en-US`,{maximumFractionDigits:t,minimumFractionDigits:t}):parseFloat(e).toLocaleString(`en-US`,{maximumFractionDigits:t,minimumFractionDigits:t})},parseLocalStringToNumber(e){return e===void 0?0:parseFloat(e.replace(/,/gu,``))}},ke=[{type:`function`,name:`transfer`,stateMutability:`nonpayable`,inputs:[{name:`_to`,type:`address`},{name:`_value`,type:`uint256`}],outputs:[{name:``,type:`bool`}]},{type:`function`,name:`transferFrom`,stateMutability:`nonpayable`,inputs:[{name:`_from`,type:`address`},{name:`_to`,type:`address`},{name:`_value`,type:`uint256`}],outputs:[{name:``,type:`bool`}]}],Ae=[{type:`function`,name:`approve`,stateMutability:`nonpayable`,inputs:[{name:`spender`,type:`address`},{name:`amount`,type:`uint256`}],outputs:[{type:`bool`}]}],je=[{type:`function`,name:`transfer`,stateMutability:`nonpayable`,inputs:[{name:`recipient`,type:`address`},{name:`amount`,type:`uint256`}],outputs:[]},{type:`function`,name:`transferFrom`,stateMutability:`nonpayable`,inputs:[{name:`sender`,type:`address`},{name:`recipient`,type:`address`},{name:`amount`,type:`uint256`}],outputs:[{name:``,type:`bool`}]}],Me={getERC20Abi:e=>b.USDT_CONTRACT_ADDRESSES.includes(e)?je:ke,getSwapAbi:()=>Ae},S={WALLET_ID:`@appkit/wallet_id`,WALLET_NAME:`@appkit/wallet_name`,SOLANA_WALLET:`@appkit/solana_wallet`,SOLANA_CAIP_CHAIN:`@appkit/solana_caip_chain`,ACTIVE_CAIP_NETWORK_ID:`@appkit/active_caip_network_id`,CONNECTED_SOCIAL:`@appkit/connected_social`,CONNECTED_SOCIAL_USERNAME:`@appkit-wallet/SOCIAL_USERNAME`,RECENT_WALLETS:`@appkit/recent_wallets`,DEEPLINK_CHOICE:`WALLETCONNECT_DEEPLINK_CHOICE`,ACTIVE_NAMESPACE:`@appkit/active_namespace`,CONNECTED_NAMESPACES:`@appkit/connected_namespaces`,CONNECTION_STATUS:`@appkit/connection_status`,SIWX_AUTH_TOKEN:`@appkit/siwx-auth-token`,SIWX_NONCE_TOKEN:`@appkit/siwx-nonce-token`,TELEGRAM_SOCIAL_PROVIDER:`@appkit/social_provider`,NATIVE_BALANCE_CACHE:`@appkit/native_balance_cache`,PORTFOLIO_CACHE:`@appkit/portfolio_cache`,ENS_CACHE:`@appkit/ens_cache`,IDENTITY_CACHE:`@appkit/identity_cache`,PREFERRED_ACCOUNT_TYPES:`@appkit/preferred_account_types`,CONNECTIONS:`@appkit/connections`};function Ne(e){if(!e)throw Error(`Namespace is required for CONNECTED_CONNECTOR_ID`);return`@appkit/${e}:connected_connector_id`}var C={setItem(e,t){Pe()&&t!==void 0&&localStorage.setItem(e,t)},getItem(e){if(Pe())return localStorage.getItem(e)||void 0},removeItem(e){Pe()&&localStorage.removeItem(e)},clear(){Pe()&&localStorage.clear()}};function Pe(){return typeof window<`u`&&typeof localStorage<`u`}function Fe(e,t){return t===`light`?{"--w3m-accent":e?.[`--w3m-accent`]||`hsla(231, 100%, 70%, 1)`,"--w3m-background":`#fff`}:{"--w3m-accent":e?.[`--w3m-accent`]||`hsla(230, 100%, 67%, 1)`,"--w3m-background":`#121313`}}var Ie=(typeof process<`u`?{}.NEXT_PUBLIC_SECURE_SITE_ORIGIN:void 0)||`https://secure.walletconnect.org`,Le=[{label:`Coinbase`,name:`coinbase`,feeRange:`1-2%`,url:``,supportedChains:[`eip155`]},{label:`Meld.io`,name:`meld`,feeRange:`1-2%`,url:`https://meldcrypto.com`,supportedChains:[`eip155`,`solana`]}],Re=`WXETMuFUQmqqybHuRkSgxv:25B8LJHSfpG6LVjR2ytU5Cwh7Z4Sch2ocoU`,w={FOUR_MINUTES_MS:24e4,TEN_SEC_MS:1e4,FIVE_SEC_MS:5e3,THREE_SEC_MS:3e3,ONE_SEC_MS:1e3,SECURE_SITE:Ie,SECURE_SITE_DASHBOARD:`${Ie}/dashboard`,SECURE_SITE_FAVICON:`${Ie}/images/favicon.png`,RESTRICTED_TIMEZONES:[`ASIA/SHANGHAI`,`ASIA/URUMQI`,`ASIA/CHONGQING`,`ASIA/HARBIN`,`ASIA/KASHGAR`,`ASIA/MACAU`,`ASIA/HONG_KONG`,`ASIA/MACAO`,`ASIA/BEIJING`,`ASIA/HARBIN`],WC_COINBASE_PAY_SDK_CHAINS:[`ethereum`,`arbitrum`,`polygon`,`berachain`,`avalanche-c-chain`,`optimism`,`celo`,`base`],WC_COINBASE_PAY_SDK_FALLBACK_CHAIN:`ethereum`,WC_COINBASE_PAY_SDK_CHAIN_NAME_MAP:{Ethereum:`ethereum`,"Arbitrum One":`arbitrum`,Polygon:`polygon`,Berachain:`berachain`,Avalanche:`avalanche-c-chain`,"OP Mainnet":`optimism`,Celo:`celo`,Base:`base`},WC_COINBASE_ONRAMP_APP_ID:`bf18c88d-495a-463b-b249-0b9d3656cf5e`,SWAP_SUGGESTED_TOKENS:`ETH.UNI.1INCH.AAVE.SOL.ADA.AVAX.DOT.LINK.NITRO.GAIA.MILK.TRX.NEAR.GNO.WBTC.DAI.WETH.USDC.USDT.ARB.BAL.BICO.CRV.ENS.MATIC.OP`.split(`.`),SWAP_POPULAR_TOKENS:`ETH.UNI.1INCH.AAVE.SOL.ADA.AVAX.DOT.LINK.NITRO.GAIA.MILK.TRX.NEAR.GNO.WBTC.DAI.WETH.USDC.USDT.ARB.BAL.BICO.CRV.ENS.MATIC.OP.METAL.DAI.CHAMP.WOLF.SALE.BAL.BUSD.MUST.BTCpx.ROUTE.HEX.WELT.amDAI.VSQ.VISION.AURUM.pSP.SNX.VC.LINK.CHP.amUSDT.SPHERE.FOX.GIDDY.GFC.OMEN.OX_OLD.DE.WNT`.split(`.`),BALANCE_SUPPORTED_CHAINS:[`eip155`,`solana`],SWAP_SUPPORTED_NETWORKS:[`eip155:1`,`eip155:42161`,`eip155:10`,`eip155:324`,`eip155:8453`,`eip155:56`,`eip155:137`,`eip155:100`,`eip155:43114`,`eip155:250`,`eip155:8217`,`eip155:1313161554`],NAMES_SUPPORTED_CHAIN_NAMESPACES:[`eip155`],ONRAMP_SUPPORTED_CHAIN_NAMESPACES:[`eip155`,`solana`],ACTIVITY_ENABLED_CHAIN_NAMESPACES:[`eip155`],NATIVE_TOKEN_ADDRESS:{eip155:`0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee`,solana:`So11111111111111111111111111111111111111111`,polkadot:`0x`,bip122:`0x`,cosmos:`0x`},CONVERT_SLIPPAGE_TOLERANCE:1,CONNECT_LABELS:{MOBILE:`Open and continue in the wallet app`,WEB:`Open and continue in the wallet app`},SEND_SUPPORTED_NAMESPACES:[`eip155`,`solana`],DEFAULT_REMOTE_FEATURES:{swaps:[`1inch`],onramp:[`coinbase`,`meld`],email:!0,socials:[`google`,`x`,`discord`,`farcaster`,`github`,`apple`,`facebook`],activity:!0,reownBranding:!0},DEFAULT_REMOTE_FEATURES_DISABLED:{email:!1,socials:!1,swaps:!1,onramp:!1,activity:!1,reownBranding:!1},DEFAULT_FEATURES:{receive:!0,send:!0,emailShowWallets:!0,connectorTypeOrder:[`walletConnect`,`recent`,`injected`,`featured`,`custom`,`external`,`recommended`],analytics:!0,allWallets:!0,legalCheckbox:!1,smartSessions:!1,collapseWallets:!1,walletFeaturesOrder:[`onramp`,`swaps`,`receive`,`send`],connectMethodsOrder:void 0,pay:!1},DEFAULT_SOCIALS:[`google`,`x`,`farcaster`,`discord`,`apple`,`github`,`facebook`],DEFAULT_ACCOUNT_TYPES:{bip122:`payment`,eip155:`smartAccount`,polkadot:`eoa`,solana:`eoa`},ADAPTER_TYPES:{UNIVERSAL:`universal`,SOLANA:`solana`,WAGMI:`wagmi`,ETHERS:`ethers`,ETHERS5:`ethers5`,BITCOIN:`bitcoin`}},T={cacheExpiry:{portfolio:3e4,nativeBalance:3e4,ens:3e5,identity:3e5},isCacheExpired(e,t){return Date.now()-e>t},getActiveNetworkProps(){let e=T.getActiveNamespace(),t=T.getActiveCaipNetworkId(),n=t?t.split(`:`)[1]:void 0;return{namespace:e,caipNetworkId:t,chainId:n?isNaN(Number(n))?n:Number(n):void 0}},setWalletConnectDeepLink({name:e,href:t}){try{C.setItem(S.DEEPLINK_CHOICE,JSON.stringify({href:t,name:e}))}catch{console.info(`Unable to set WalletConnect deep link`)}},getWalletConnectDeepLink(){try{let e=C.getItem(S.DEEPLINK_CHOICE);if(e)return JSON.parse(e)}catch{console.info(`Unable to get WalletConnect deep link`)}},deleteWalletConnectDeepLink(){try{C.removeItem(S.DEEPLINK_CHOICE)}catch{console.info(`Unable to delete WalletConnect deep link`)}},setActiveNamespace(e){try{C.setItem(S.ACTIVE_NAMESPACE,e)}catch{console.info(`Unable to set active namespace`)}},setActiveCaipNetworkId(e){try{C.setItem(S.ACTIVE_CAIP_NETWORK_ID,e),T.setActiveNamespace(e.split(`:`)[0])}catch{console.info(`Unable to set active caip network id`)}},getActiveCaipNetworkId(){try{return C.getItem(S.ACTIVE_CAIP_NETWORK_ID)}catch{console.info(`Unable to get active caip network id`);return}},deleteActiveCaipNetworkId(){try{C.removeItem(S.ACTIVE_CAIP_NETWORK_ID)}catch{console.info(`Unable to delete active caip network id`)}},deleteConnectedConnectorId(e){try{let t=Ne(e);C.removeItem(t)}catch{console.info(`Unable to delete connected connector id`)}},setAppKitRecent(e){try{let t=T.getRecentWallets();t.find(t=>t.id===e.id)||(t.unshift(e),t.length>2&&t.pop(),C.setItem(S.RECENT_WALLETS,JSON.stringify(t)))}catch{console.info(`Unable to set AppKit recent`)}},getRecentWallets(){try{let e=C.getItem(S.RECENT_WALLETS);return e?JSON.parse(e):[]}catch{console.info(`Unable to get AppKit recent`)}return[]},setConnectedConnectorId(e,t){try{let n=Ne(e);C.setItem(n,t)}catch{console.info(`Unable to set Connected Connector Id`)}},getActiveNamespace(){try{return C.getItem(S.ACTIVE_NAMESPACE)}catch{console.info(`Unable to get active namespace`)}},getConnectedConnectorId(e){if(e)try{let t=Ne(e);return C.getItem(t)}catch{console.info(`Unable to get connected connector id in namespace `,e)}},setConnectedSocialProvider(e){try{C.setItem(S.CONNECTED_SOCIAL,e)}catch{console.info(`Unable to set connected social provider`)}},getConnectedSocialProvider(){try{return C.getItem(S.CONNECTED_SOCIAL)}catch{console.info(`Unable to get connected social provider`)}},deleteConnectedSocialProvider(){try{C.removeItem(S.CONNECTED_SOCIAL)}catch{console.info(`Unable to delete connected social provider`)}},getConnectedSocialUsername(){try{return C.getItem(S.CONNECTED_SOCIAL_USERNAME)}catch{console.info(`Unable to get connected social username`)}},getStoredActiveCaipNetworkId(){return C.getItem(S.ACTIVE_CAIP_NETWORK_ID)?.split(`:`)?.[1]},setConnectionStatus(e){try{C.setItem(S.CONNECTION_STATUS,e)}catch{console.info(`Unable to set connection status`)}},getConnectionStatus(){try{return C.getItem(S.CONNECTION_STATUS)}catch{return}},getConnectedNamespaces(){try{let e=C.getItem(S.CONNECTED_NAMESPACES);return e?.length?e.split(`,`):[]}catch{return[]}},setConnectedNamespaces(e){try{let t=Array.from(new Set(e));C.setItem(S.CONNECTED_NAMESPACES,t.join(`,`))}catch{console.info(`Unable to set namespaces in storage`)}},addConnectedNamespace(e){try{let t=T.getConnectedNamespaces();t.includes(e)||(t.push(e),T.setConnectedNamespaces(t))}catch{console.info(`Unable to add connected namespace`)}},removeConnectedNamespace(e){try{let t=T.getConnectedNamespaces(),n=t.indexOf(e);n>-1&&(t.splice(n,1),T.setConnectedNamespaces(t))}catch{console.info(`Unable to remove connected namespace`)}},getTelegramSocialProvider(){try{return C.getItem(S.TELEGRAM_SOCIAL_PROVIDER)}catch{return console.info(`Unable to get telegram social provider`),null}},setTelegramSocialProvider(e){try{C.setItem(S.TELEGRAM_SOCIAL_PROVIDER,e)}catch{console.info(`Unable to set telegram social provider`)}},removeTelegramSocialProvider(){try{C.removeItem(S.TELEGRAM_SOCIAL_PROVIDER)}catch{console.info(`Unable to remove telegram social provider`)}},getBalanceCache(){let e={};try{let t=C.getItem(S.PORTFOLIO_CACHE);e=t?JSON.parse(t):{}}catch{console.info(`Unable to get balance cache`)}return e},removeAddressFromBalanceCache(e){try{let t=T.getBalanceCache();C.setItem(S.PORTFOLIO_CACHE,JSON.stringify({...t,[e]:void 0}))}catch{console.info(`Unable to remove address from balance cache`,e)}},getBalanceCacheForCaipAddress(e){try{let t=T.getBalanceCache()[e];if(t&&!this.isCacheExpired(t.timestamp,this.cacheExpiry.portfolio))return t.balance;T.removeAddressFromBalanceCache(e)}catch{console.info(`Unable to get balance cache for address`,e)}},updateBalanceCache(e){try{let t=T.getBalanceCache();t[e.caipAddress]=e,C.setItem(S.PORTFOLIO_CACHE,JSON.stringify(t))}catch{console.info(`Unable to update balance cache`,e)}},getNativeBalanceCache(){let e={};try{let t=C.getItem(S.NATIVE_BALANCE_CACHE);e=t?JSON.parse(t):{}}catch{console.info(`Unable to get balance cache`)}return e},removeAddressFromNativeBalanceCache(e){try{let t=T.getBalanceCache();C.setItem(S.NATIVE_BALANCE_CACHE,JSON.stringify({...t,[e]:void 0}))}catch{console.info(`Unable to remove address from balance cache`,e)}},getNativeBalanceCacheForCaipAddress(e){try{let t=T.getNativeBalanceCache()[e];if(t&&!this.isCacheExpired(t.timestamp,this.cacheExpiry.nativeBalance))return t;console.info(`Discarding cache for address`,e),T.removeAddressFromBalanceCache(e)}catch{console.info(`Unable to get balance cache for address`,e)}},updateNativeBalanceCache(e){try{let t=T.getNativeBalanceCache();t[e.caipAddress]=e,C.setItem(S.NATIVE_BALANCE_CACHE,JSON.stringify(t))}catch{console.info(`Unable to update balance cache`,e)}},getEnsCache(){let e={};try{let t=C.getItem(S.ENS_CACHE);e=t?JSON.parse(t):{}}catch{console.info(`Unable to get ens name cache`)}return e},getEnsFromCacheForAddress(e){try{let t=T.getEnsCache()[e];if(t&&!this.isCacheExpired(t.timestamp,this.cacheExpiry.ens))return t.ens;T.removeEnsFromCache(e)}catch{console.info(`Unable to get ens name from cache`,e)}},updateEnsCache(e){try{let t=T.getEnsCache();t[e.address]=e,C.setItem(S.ENS_CACHE,JSON.stringify(t))}catch{console.info(`Unable to update ens name cache`,e)}},removeEnsFromCache(e){try{let t=T.getEnsCache();C.setItem(S.ENS_CACHE,JSON.stringify({...t,[e]:void 0}))}catch{console.info(`Unable to remove ens name from cache`,e)}},getIdentityCache(){let e={};try{let t=C.getItem(S.IDENTITY_CACHE);e=t?JSON.parse(t):{}}catch{console.info(`Unable to get identity cache`)}return e},getIdentityFromCacheForAddress(e){try{let t=T.getIdentityCache()[e];if(t&&!this.isCacheExpired(t.timestamp,this.cacheExpiry.identity))return t.identity;T.removeIdentityFromCache(e)}catch{console.info(`Unable to get identity from cache`,e)}},updateIdentityCache(e){try{let t=T.getIdentityCache();t[e.address]={identity:e.identity,timestamp:e.timestamp},C.setItem(S.IDENTITY_CACHE,JSON.stringify(t))}catch{console.info(`Unable to update identity cache`,e)}},removeIdentityFromCache(e){try{let t=T.getIdentityCache();C.setItem(S.IDENTITY_CACHE,JSON.stringify({...t,[e]:void 0}))}catch{console.info(`Unable to remove identity from cache`,e)}},clearAddressCache(){try{C.removeItem(S.PORTFOLIO_CACHE),C.removeItem(S.NATIVE_BALANCE_CACHE),C.removeItem(S.ENS_CACHE),C.removeItem(S.IDENTITY_CACHE)}catch{console.info(`Unable to clear address cache`)}},setPreferredAccountTypes(e){try{C.setItem(S.PREFERRED_ACCOUNT_TYPES,JSON.stringify(e))}catch{console.info(`Unable to set preferred account types`,e)}},getPreferredAccountTypes(){try{let e=C.getItem(S.PREFERRED_ACCOUNT_TYPES);return e?JSON.parse(e):{}}catch{console.info(`Unable to get preferred account types`)}return{}},setConnections(e,t){try{let n={...T.getConnections(),[t]:e};C.setItem(S.CONNECTIONS,JSON.stringify(n))}catch(e){console.error(`Unable to sync connections to storage`,e)}},getConnections(){try{let e=C.getItem(S.CONNECTIONS);return e?JSON.parse(e):{}}catch(e){return console.error(`Unable to get connections from storage`,e),{}}}},E={isMobile(){return this.isClient()?!!(typeof window?.matchMedia==`function`&&window?.matchMedia(`(pointer:coarse)`)?.matches||/Android|webOS|iPhone|iPad|iPod|BlackBerry|Opera Mini/u.test(navigator.userAgent)):!1},checkCaipNetwork(e,t=``){return e?.caipNetworkId.toLocaleLowerCase().includes(t.toLowerCase())},isAndroid(){if(!this.isMobile())return!1;let e=window?.navigator.userAgent.toLowerCase();return E.isMobile()&&e.includes(`android`)},isIos(){if(!this.isMobile())return!1;let e=window?.navigator.userAgent.toLowerCase();return e.includes(`iphone`)||e.includes(`ipad`)},isSafari(){return this.isClient()?(window?.navigator.userAgent.toLowerCase()).includes(`safari`):!1},isClient(){return typeof window<`u`},isPairingExpired(e){return e?e-Date.now()<=w.TEN_SEC_MS:!0},isAllowedRetry(e,t=w.ONE_SEC_MS){return Date.now()-e>=t},copyToClopboard(e){navigator.clipboard.writeText(e)},isIframe(){try{return window?.self!==window?.top}catch{return!1}},isSafeApp(){if(E.isClient()&&window.self!==window.top)try{let e=window?.location?.ancestorOrigins?.[0];if(e){let t=new URL(e),n=new URL(`https://app.safe.global`);return t.hostname===n.hostname}}catch{return!1}return!1},getPairingExpiry(){return Date.now()+w.FOUR_MINUTES_MS},getNetworkId(e){return e?.split(`:`)[1]},getPlainAddress(e){return e?.split(`:`)[2]},async wait(e){return new Promise(t=>{setTimeout(t,e)})},debounce(e,t=500){let n;return(...r)=>{function i(){e(...r)}n&&clearTimeout(n),n=setTimeout(i,t)}},isHttpUrl(e){return e.startsWith(`http://`)||e.startsWith(`https://`)},formatNativeUrl(e,t,n=null){if(E.isHttpUrl(e))return this.formatUniversalUrl(e,t);let r=e,i=n;r.includes(`://`)||(r=e.replaceAll(`/`,``).replaceAll(`:`,``),r=`${r}://`),r.endsWith(`/`)||(r=`${r}/`),i&&!i?.endsWith(`/`)&&(i=`${i}/`),this.isTelegram()&&this.isAndroid()&&(t=encodeURIComponent(t));let a=encodeURIComponent(t);return{redirect:`${r}wc?uri=${a}`,redirectUniversalLink:i?`${i}wc?uri=${a}`:void 0,href:r}},formatUniversalUrl(e,t){if(!E.isHttpUrl(e))return this.formatNativeUrl(e,t);let n=e;return n.endsWith(`/`)||(n=`${n}/`),{redirect:`${n}wc?uri=${encodeURIComponent(t)}`,href:n}},getOpenTargetForPlatform(e){return e===`popupWindow`?e:this.isTelegram()?T.getTelegramSocialProvider()?`_top`:`_blank`:e},openHref(e,t,n){window?.open(e,this.getOpenTargetForPlatform(t),n||`noreferrer noopener`)},returnOpenHref(e,t,n){return window?.open(e,this.getOpenTargetForPlatform(t),n||`noreferrer noopener`)},isTelegram(){return typeof window<`u`&&(!!window.TelegramWebviewProxy||!!window.Telegram||!!window.TelegramWebviewProxyProto)},isPWA(){if(typeof window>`u`)return!1;let e=window.matchMedia?.(`(display-mode: standalone)`)?.matches,t=window?.navigator?.standalone;return!!(e||t)},async preloadImage(e){let t=new Promise((t,n)=>{let r=new Image;r.onload=t,r.onerror=n,r.crossOrigin=`anonymous`,r.src=e});return Promise.race([t,E.wait(2e3)])},formatBalance(e,t){let n=`0.000`;if(typeof e==`string`){let t=Number(e);if(t){let e=Math.floor(t*1e3)/1e3;e&&(n=e.toString())}}return`${n}${t?` ${t}`:``}`},formatBalance2(e,t){let n;if(e===`0`)n=`0`;else if(typeof e==`string`){let t=Number(e);t&&(n=t.toString().match(/^-?\d+(?:\.\d{0,3})?/u)?.[0])}return{value:n??`0`,rest:n===`0`?`000`:``,symbol:t}},getApiUrl(){return b.W3M_API_URL},getBlockchainApiUrl(){return b.BLOCKCHAIN_API_RPC_URL},getAnalyticsUrl(){return b.PULSE_API_URL},getUUID(){return crypto?.randomUUID?crypto.randomUUID():`xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/gu,e=>{let t=Math.random()*16|0;return(e===`x`?t:t&3|8).toString(16)})},parseError(e){return typeof e==`string`?e:typeof e?.issues?.[0]?.message==`string`?e.issues[0].message:e instanceof Error?e.message:`Unknown error`},sortRequestedNetworks(e,t=[]){let n={};return t&&e&&(e.forEach((e,t)=>{n[e]=t}),t.sort((e,t)=>{let r=n[e.id],i=n[t.id];return r!==void 0&&i!==void 0?r-i:r===void 0?i===void 0?0:1:-1})),t},calculateBalance(e){let t=0;for(let n of e)t+=n.value??0;return t},formatTokenBalance(e){let[t,n]=e.toFixed(2).split(`.`);return{dollars:t,pennies:n}},isAddress(e,t=`eip155`){switch(t){case`eip155`:return/^(?:0x)?[0-9a-f]{40}$/iu.test(e)?!!(/^(?:0x)?[0-9a-f]{40}$/iu.test(e)||/^(?:0x)?[0-9A-F]{40}$/iu.test(e)):!1;case`solana`:return/[1-9A-HJ-NP-Za-km-z]{32,44}$/iu.test(e);default:return!1}},uniqueBy(e,t){let n=new Set;return e.filter(e=>{let r=e[t];return n.has(r)?!1:(n.add(r),!0)})},generateSdkVersion(e,t,n){return`${t}-${e.length===0?w.ADAPTER_TYPES.UNIVERSAL:e.map(e=>e.adapterType).join(`,`)}-${n}`},createAccount(e,t,n,r,i){return{namespace:e,address:t,type:n,publicKey:r,path:i}},isCaipAddress(e){if(typeof e!=`string`)return!1;let t=e.split(`:`),n=t[0];return t.filter(Boolean).length===3&&n in b.CHAIN_NAME_MAP},isMac(){let e=window?.navigator.userAgent.toLowerCase();return e.includes(`macintosh`)&&!e.includes(`safari`)},formatTelegramSocialLoginUrl(e){let t=`--${encodeURIComponent(window?.location.href)}`,n=`state=`;if(new URL(e).host===`auth.magic.link`){let r=e.substring(e.indexOf(`provider_authorization_url=`)+27),i=this.injectIntoUrl(decodeURIComponent(r),n,t);return e.replace(r,encodeURIComponent(i))}return this.injectIntoUrl(e,n,t)},injectIntoUrl(e,t,n){let r=e.indexOf(t);if(r===-1)throw Error(`${t} parameter not found in the URL: ${e}`);let i=e.indexOf(`&`,r),a=t.length,o=i===-1?e.length:i,s=e.substring(0,r+a),c=e.substring(r+a,o),l=e.substring(i);return s+(c+n)+l}};async function ze(...e){let t=await fetch(...e);if(!t.ok)throw Error(`HTTP status code: ${t.status}`,{cause:t});return t}var Be=class{constructor({baseUrl:e,clientId:t}){this.baseUrl=e,this.clientId=t}async get({headers:e,signal:t,cache:n,...r}){return(await ze(this.createUrl(r),{method:`GET`,headers:e,signal:t,cache:n})).json()}async getBlob({headers:e,signal:t,...n}){return(await ze(this.createUrl(n),{method:`GET`,headers:e,signal:t})).blob()}async post({body:e,headers:t,signal:n,...r}){return(await ze(this.createUrl(r),{method:`POST`,headers:t,body:e?JSON.stringify(e):void 0,signal:n})).json()}async put({body:e,headers:t,signal:n,...r}){return(await ze(this.createUrl(r),{method:`PUT`,headers:t,body:e?JSON.stringify(e):void 0,signal:n})).json()}async delete({body:e,headers:t,signal:n,...r}){return(await ze(this.createUrl(r),{method:`DELETE`,headers:t,body:e?JSON.stringify(e):void 0,signal:n})).json()}createUrl({path:e,params:t}){let n=new URL(e,this.baseUrl);return t&&Object.entries(t).forEach(([e,t])=>{t&&n.searchParams.append(e,t)}),this.clientId&&n.searchParams.append(`clientId`,this.clientId),n}},Ve={getFeatureValue(e,t){let n=t?.[e];return n===void 0?w.DEFAULT_FEATURES[e]:n},filterSocialsByPlatform(e){if(!e||!e.length)return e;if(E.isTelegram()){if(E.isIos())return e.filter(e=>e!==`google`);if(E.isMac())return e.filter(e=>e!==`x`);if(E.isAndroid())return e.filter(e=>![`facebook`,`x`].includes(e))}return e}},D=_({features:w.DEFAULT_FEATURES,projectId:``,sdkType:`appkit`,sdkVersion:`html-wagmi-undefined`,defaultAccountTypes:w.DEFAULT_ACCOUNT_TYPES,enableNetworkSwitch:!0,experimental_preferUniversalLinks:!1,remoteFeatures:{}}),O={state:D,subscribeKey(e,t){return y(D,e,t)},setOptions(e){Object.assign(D,e)},setRemoteFeatures(e){e&&(D.remoteFeatures={...D.remoteFeatures,...e},D.remoteFeatures?.socials&&(D.remoteFeatures.socials=Ve.filterSocialsByPlatform(D.remoteFeatures.socials)))},setFeatures(e){e&&(D.features||=w.DEFAULT_FEATURES,D.features={...D.features,...e})},setProjectId(e){D.projectId=e},setCustomRpcUrls(e){D.customRpcUrls=e},setAllWallets(e){D.allWallets=e},setIncludeWalletIds(e){D.includeWalletIds=e},setExcludeWalletIds(e){D.excludeWalletIds=e},setFeaturedWalletIds(e){D.featuredWalletIds=e},setTokens(e){D.tokens=e},setTermsConditionsUrl(e){D.termsConditionsUrl=e},setPrivacyPolicyUrl(e){D.privacyPolicyUrl=e},setCustomWallets(e){D.customWallets=e},setIsSiweEnabled(e){D.isSiweEnabled=e},setIsUniversalProvider(e){D.isUniversalProvider=e},setSdkVersion(e){D.sdkVersion=e},setMetadata(e){D.metadata=e},setDisableAppend(e){D.disableAppend=e},setEIP6963Enabled(e){D.enableEIP6963=e},setDebug(e){D.debug=e},setEnableWalletConnect(e){D.enableWalletConnect=e},setEnableWalletGuide(e){D.enableWalletGuide=e},setEnableAuthLogger(e){D.enableAuthLogger=e},setEnableWallets(e){D.enableWallets=e},setPreferUniversalLinks(e){D.experimental_preferUniversalLinks=e},setHasMultipleAddresses(e){D.hasMultipleAddresses=e},setSIWX(e){D.siwx=e},setConnectMethodsOrder(e){D.features={...D.features,connectMethodsOrder:e}},setWalletFeaturesOrder(e){D.features={...D.features,walletFeaturesOrder:e}},setSocialsOrder(e){D.remoteFeatures={...D.remoteFeatures,socials:e}},setCollapseWallets(e){D.features={...D.features,collapseWallets:e}},setEnableEmbedded(e){D.enableEmbedded=e},setAllowUnsupportedChain(e){D.allowUnsupportedChain=e},setManualWCControl(e){D.manualWCControl=e},setEnableNetworkSwitch(e){D.enableNetworkSwitch=e},setDefaultAccountTypes(e={}){Object.entries(e).forEach(([e,t])=>{t&&(D.defaultAccountTypes[e]=t)})},setUniversalProviderConfigOverride(e){D.universalProviderConfigOverride=e},getUniversalProviderConfigOverride(){return D.universalProviderConfigOverride},getSnapshot(){return ae(D)}},He=Object.freeze({enabled:!0,events:[]}),Ue=new Be({baseUrl:E.getAnalyticsUrl(),clientId:null}),We=5,Ge=60*1e3,Ke=_({...He}),qe={state:Ke,subscribeKey(e,t){return y(Ke,e,t)},async sendError(e,t){if(!Ke.enabled)return;let n=Date.now();if(Ke.events.filter(e=>n-new Date(e.properties.timestamp||``).getTime()<Ge).length>=We)return;let r={type:`error`,event:t,properties:{errorType:e.name,errorMessage:e.message,stackTrace:e.stack,timestamp:new Date().toISOString()}};Ke.events.push(r);try{if(typeof window>`u`)return;let{projectId:n,sdkType:r,sdkVersion:i}=O.state;await Ue.post({path:`/e`,params:{projectId:n,st:r,sv:i||`html-wagmi-4.2.2`},body:{eventId:E.getUUID(),url:window.location.href,domain:window.location.hostname,timestamp:new Date().toISOString(),props:{type:`error`,event:t,errorType:e.name,errorMessage:e.message,stackTrace:e.stack}}})}catch{}},enable(){Ke.enabled=!0},disable(){Ke.enabled=!1},clearEvents(){Ke.events=[]}},Je=class e extends Error{constructor(t,n,r){super(t),this.name=`AppKitError`,this.category=n,this.originalError=r,Object.setPrototypeOf(this,e.prototype);let i=!1;if(r instanceof Error&&typeof r.stack==`string`&&r.stack){let e=r.stack,t=e.indexOf(`
`);if(t>-1){let n=e.substring(t+1);this.stack=`${this.name}: ${this.message}\n${n}`,i=!0}}i||(Error.captureStackTrace?Error.captureStackTrace(this,e):this.stack||=`${this.name}: ${this.message}`)}};function Ye(e,t){let n=e instanceof Je?e:new Je(e instanceof Error?e.message:String(e),t,e);throw qe.sendError(n,n.category),n}function k(e,t=`INTERNAL_SDK_ERROR`){let n={};return Object.keys(e).forEach(r=>{let i=e[r];if(typeof i==`function`){let e=i;e=i.constructor.name===`AsyncFunction`?async(...e)=>{try{return await i(...e)}catch(e){return Ye(e,t)}}:(...e)=>{try{return i(...e)}catch(e){return Ye(e,t)}},n[r]=e}else n[r]=i}),n}var A={PHANTOM:{id:`a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393`,url:`https://phantom.app`},SOLFLARE:{id:`1ca0bdd4747578705b1939af023d120677c64fe6ca76add81fda36e350605e79`,url:`https://solflare.com`},COINBASE:{id:`fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa`,url:`https://go.cb-w.com`}},Xe={handleMobileDeeplinkRedirect(e,t){let n=window.location.href,r=encodeURIComponent(n);if(e===A.PHANTOM.id&&!(`phantom`in window)){let e=n.startsWith(`https`)?`https`:`http`,t=n.split(`/`)[2],i=encodeURIComponent(`${e}://${t}`);window.location.href=`${A.PHANTOM.url}/ul/browse/${r}?ref=${i}`}e===A.SOLFLARE.id&&!(`solflare`in window)&&(window.location.href=`${A.SOLFLARE.url}/ul/v1/browse/${r}?ref=${r}`),t===b.CHAIN.SOLANA&&e===A.COINBASE.id&&!(`coinbaseSolana`in window)&&(window.location.href=`${A.COINBASE.url}/dapp?cb_url=${r}`)}},j=_({walletImages:{},networkImages:{},chainImages:{},connectorImages:{},tokenImages:{},currencyImages:{}}),M=k({state:j,subscribeNetworkImages(e){return v(j.networkImages,()=>e(j.networkImages))},subscribeKey(e,t){return y(j,e,t)},subscribe(e){return v(j,()=>e(j))},setWalletImage(e,t){j.walletImages[e]=t},setNetworkImage(e,t){j.networkImages[e]=t},setChainImage(e,t){j.chainImages[e]=t},setConnectorImage(e,t){j.connectorImages={...j.connectorImages,[e]:t}},setTokenImage(e,t){j.tokenImages[e]=t},setCurrencyImage(e,t){j.currencyImages[e]=t}}),Ze={eip155:`ba0ba0cd-17c6-4806-ad93-f9d174f17900`,solana:`a1b58899-f671-4276-6a5e-56ca5bd59700`,polkadot:``,bip122:`0b4838db-0161-4ffe-022d-532bf03dba00`,cosmos:``},Qe=_({networkImagePromises:{}}),$e={async fetchWalletImage(e){if(e)return await I._fetchWalletImage(e),this.getWalletImageById(e)},async fetchNetworkImage(e){return e?this.getNetworkImageById(e)||(Qe.networkImagePromises[e]||(Qe.networkImagePromises[e]=I._fetchNetworkImage(e)),await Qe.networkImagePromises[e],this.getNetworkImageById(e)):void 0},getWalletImageById(e){if(e)return M.state.walletImages[e]},getWalletImage(e){if(e?.image_url)return e?.image_url;if(e?.image_id)return M.state.walletImages[e.image_id]},getNetworkImage(e){if(e?.assets?.imageUrl)return e?.assets?.imageUrl;if(e?.assets?.imageId)return M.state.networkImages[e.assets.imageId]},getNetworkImageById(e){if(e)return M.state.networkImages[e]},getConnectorImage(e){if(e?.imageUrl)return e.imageUrl;if(e?.imageId)return M.state.connectorImages[e.imageId]},getChainImage(e){return M.state.networkImages[Ze[e]]}},et=_({message:``,variant:`info`,open:!1}),tt=k({state:et,subscribeKey(e,t){return y(et,e,t)},open(e,t){let{debug:n}=O.state,{shortMessage:r,longMessage:i}=e;n&&(et.message=r,et.variant=t,et.open=!0),i&&console.error(typeof i==`function`?i():i)},close(){et.open=!1,et.message=``,et.variant=`info`}}),nt=new Be({baseUrl:E.getAnalyticsUrl(),clientId:null}),rt=[`MODAL_CREATED`],it=_({timestamp:Date.now(),reportedErrors:{},data:{type:`track`,event:`MODAL_CREATED`}}),N={state:it,subscribe(e){return v(it,()=>e(it))},getSdkProperties(){let{projectId:e,sdkType:t,sdkVersion:n}=O.state;return{projectId:e,st:t,sv:n||`html-wagmi-4.2.2`}},async _sendAnalyticsEvent(e){try{let t=Q.state.address;if(rt.includes(e.data.event)||typeof window>`u`)return;await nt.post({path:`/e`,params:N.getSdkProperties(),body:{eventId:E.getUUID(),url:window.location.href,domain:window.location.hostname,timestamp:e.timestamp,props:{...e.data,address:t}}}),it.reportedErrors.FORBIDDEN=!1}catch(e){e instanceof Error&&e.cause instanceof Response&&e.cause.status===b.HTTP_STATUS_CODES.FORBIDDEN&&!it.reportedErrors.FORBIDDEN&&(tt.open({shortMessage:`Invalid App Configuration`,longMessage:`Origin ${Pe()?window.origin:`uknown`} not found on Allowlist - update configuration on cloud.reown.com`},`error`),it.reportedErrors.FORBIDDEN=!0)}},sendEvent(e){it.timestamp=Date.now(),it.data=e,O.state.features?.analytics&&N._sendAnalyticsEvent(it)}},P=new Be({baseUrl:E.getApiUrl(),clientId:null}),at=40,ot=4,st=20,F=_({promises:{},page:1,count:0,featured:[],allFeatured:[],recommended:[],allRecommended:[],wallets:[],filteredWallets:[],search:[],isAnalyticsEnabled:!1,excludedWallets:[],isFetchingRecommendedWallets:!1}),I={state:F,subscribeKey(e,t){return y(F,e,t)},_getSdkProperties(){let{projectId:e,sdkType:t,sdkVersion:n}=O.state;return{projectId:e,st:t||`appkit`,sv:n||`html-wagmi-4.2.2`}},_filterOutExtensions(e){return O.state.isUniversalProvider?e.filter(e=>!!(e.mobile_link||e.desktop_link||e.webapp_link)):e},async _fetchWalletImage(e){let t=`${P.baseUrl}/getWalletImage/${e}`,n=await P.getBlob({path:t,params:I._getSdkProperties()});M.setWalletImage(e,URL.createObjectURL(n))},async _fetchNetworkImage(e){let t=`${P.baseUrl}/public/getAssetImage/${e}`,n=await P.getBlob({path:t,params:I._getSdkProperties()});M.setNetworkImage(e,URL.createObjectURL(n))},async _fetchConnectorImage(e){let t=`${P.baseUrl}/public/getAssetImage/${e}`,n=await P.getBlob({path:t,params:I._getSdkProperties()});M.setConnectorImage(e,URL.createObjectURL(n))},async _fetchCurrencyImage(e){let t=`${P.baseUrl}/public/getCurrencyImage/${e}`,n=await P.getBlob({path:t,params:I._getSdkProperties()});M.setCurrencyImage(e,URL.createObjectURL(n))},async _fetchTokenImage(e){let t=`${P.baseUrl}/public/getTokenImage/${e}`,n=await P.getBlob({path:t,params:I._getSdkProperties()});M.setTokenImage(e,URL.createObjectURL(n))},_filterWalletsByPlatform(e){return E.isMobile()?e?.filter(e=>e.mobile_link||e.id===A.COINBASE.id?!0:J.state.activeChain===`solana`&&(e.id===A.SOLFLARE.id||e.id===A.PHANTOM.id)):e},async fetchProjectConfig(){return(await P.get({path:`/appkit/v1/config`,params:I._getSdkProperties()})).features},async fetchAllowedOrigins(){try{let{allowedOrigins:e}=await P.get({path:`/projects/v1/origins`,params:I._getSdkProperties()});return e}catch{return[]}},async fetchNetworkImages(){let e=J.getAllRequestedCaipNetworks()?.map(({assets:e})=>e?.imageId).filter(Boolean).filter(e=>!$e.getNetworkImageById(e));e&&await Promise.allSettled(e.map(e=>I._fetchNetworkImage(e)))},async fetchConnectorImages(){let{connectors:e}=B.state,t=e.map(({imageId:e})=>e).filter(Boolean);await Promise.allSettled(t.map(e=>I._fetchConnectorImage(e)))},async fetchCurrencyImages(e=[]){await Promise.allSettled(e.map(e=>I._fetchCurrencyImage(e)))},async fetchTokenImages(e=[]){await Promise.allSettled(e.map(e=>I._fetchTokenImage(e)))},async fetchWallets(e){let t=e.exclude??[];I._getSdkProperties().sv.startsWith(`html-core-`)&&t.push(...Object.values(A).map(e=>e.id));let n=await P.get({path:`/getWallets`,params:{...I._getSdkProperties(),...e,page:String(e.page),entries:String(e.entries),include:e.include?.join(`,`),exclude:t.join(`,`)}});return{data:I._filterWalletsByPlatform(n?.data)||[],count:n?.count}},async fetchFeaturedWallets(){let{featuredWalletIds:e}=O.state;if(e?.length){let t={...I._getSdkProperties(),page:1,entries:e?.length??ot,include:e},{data:n}=await I.fetchWallets(t),r=[...n].sort((t,n)=>e.indexOf(t.id)-e.indexOf(n.id)),i=r.map(e=>e.image_id).filter(Boolean);await Promise.allSettled(i.map(e=>I._fetchWalletImage(e))),F.featured=r,F.allFeatured=r}},async fetchRecommendedWallets(){try{F.isFetchingRecommendedWallets=!0;let{includeWalletIds:e,excludeWalletIds:t,featuredWalletIds:n}=O.state,r={page:1,entries:ot,include:e,exclude:[...t??[],...n??[]].filter(Boolean),chains:J.getRequestedCaipNetworkIds().join(`,`)},{data:i,count:a}=await I.fetchWallets(r),o=T.getRecentWallets(),s=i.map(e=>e.image_id).filter(Boolean),c=o.map(e=>e.image_id).filter(Boolean);await Promise.allSettled([...s,...c].map(e=>I._fetchWalletImage(e))),F.recommended=i,F.allRecommended=i,F.count=a??0}catch{}finally{F.isFetchingRecommendedWallets=!1}},async fetchWalletsByPage({page:e}){let{includeWalletIds:t,excludeWalletIds:n,featuredWalletIds:r}=O.state,i=J.getRequestedCaipNetworkIds().join(`,`),a={page:e,entries:at,include:t,exclude:[...F.recommended.map(({id:e})=>e),...n??[],...r??[]].filter(Boolean),chains:i},{data:o,count:s}=await I.fetchWallets(a),c=o.slice(0,st).map(e=>e.image_id).filter(Boolean);await Promise.allSettled(c.map(e=>I._fetchWalletImage(e))),F.wallets=E.uniqueBy([...F.wallets,...I._filterOutExtensions(o)],`id`).filter(e=>e.chains?.some(e=>i.includes(e))),F.count=s>F.count?s:F.count,F.page=e},async initializeExcludedWallets({ids:e}){let t={page:1,entries:e.length,include:e},{data:n}=await I.fetchWallets(t);n&&n.forEach(e=>{F.excludedWallets.push({rdns:e.rdns,name:e.name})})},async searchWallet({search:e,badge:t}){let{includeWalletIds:n,excludeWalletIds:r}=O.state,i=J.getRequestedCaipNetworkIds().join(`,`);F.search=[];let a={page:1,entries:100,search:e?.trim(),badge_type:t,include:n,exclude:r,chains:i},{data:o}=await I.fetchWallets(a);N.sendEvent({type:`track`,event:`SEARCH_WALLET`,properties:{badge:t??``,search:e??``}});let s=o.map(e=>e.image_id).filter(Boolean);await Promise.allSettled([...s.map(e=>I._fetchWalletImage(e)),E.wait(300)]),F.search=I._filterOutExtensions(o)},initPromise(e,t){return F.promises[e]||(F.promises[e]=t())},prefetch({fetchConnectorImages:e=!0,fetchFeaturedWallets:t=!0,fetchRecommendedWallets:n=!0,fetchNetworkImages:r=!0}={}){let i=[e&&I.initPromise(`connectorImages`,I.fetchConnectorImages),t&&I.initPromise(`featuredWallets`,I.fetchFeaturedWallets),n&&I.initPromise(`recommendedWallets`,I.fetchRecommendedWallets),r&&I.initPromise(`networkImages`,I.fetchNetworkImages)].filter(Boolean);return Promise.allSettled(i)},prefetchAnalyticsConfig(){O.state.features?.analytics&&I.fetchAnalyticsConfig()},async fetchAnalyticsConfig(){try{let{isAnalyticsEnabled:e}=await P.get({path:`/getAnalyticsConfig`,params:I._getSdkProperties()});O.setFeatures({analytics:e})}catch{O.setFeatures({analytics:!1})}},filterByNamespaces(e){if(!e?.length){F.featured=F.allFeatured,F.recommended=F.allRecommended;return}let t=J.getRequestedCaipNetworkIds().join(`,`);F.featured=F.allFeatured.filter(e=>e.chains?.some(e=>t.includes(e))),F.recommended=F.allRecommended.filter(e=>e.chains?.some(e=>t.includes(e))),F.filteredWallets=F.wallets.filter(e=>e.chains?.some(e=>t.includes(e)))},clearFilterByNamespaces(){F.filteredWallets=[]},setFilterByNamespace(e){if(!e){F.featured=F.allFeatured,F.recommended=F.allRecommended;return}let t=J.getRequestedCaipNetworkIds().join(`,`);F.featured=F.allFeatured.filter(e=>e.chains?.some(e=>t.includes(e))),F.recommended=F.allRecommended.filter(e=>e.chains?.some(e=>t.includes(e))),F.filteredWallets=F.wallets.filter(e=>e.chains?.some(e=>t.includes(e)))}},L=_({view:`Connect`,history:[`Connect`],transactionStack:[]}),R=k({state:L,subscribeKey(e,t){return y(L,e,t)},pushTransactionStack(e){L.transactionStack.push(e)},popTransactionStack(e){let t=L.transactionStack.pop();if(!t)return;let{onSuccess:n,onError:r,onCancel:i}=t;switch(e){case`success`:n?.();break;case`error`:r?.(),R.goBack();break;case`cancel`:i?.(),R.goBack();break;default:}},push(e,t){e!==L.view&&(L.view=e,L.history.push(e),L.data=t)},reset(e,t){L.view=e,L.history=[e],L.data=t},replace(e,t){L.history.at(-1)!==e&&(L.view=e,L.history[L.history.length-1]=e,L.data=t)},goBack(){let e=J.state.activeCaipAddress,t=R.state.view===`ConnectingFarcaster`,n=!e&&t;if(L.history.length>1){L.history.pop();let[t]=L.history.slice(-1);t&&(e&&t===`Connect`?L.view=`Account`:L.view=t)}else Et.close();L.data?.wallet&&(L.data.wallet=void 0),setTimeout(()=>{if(n){Q.setFarcasterUrl(void 0,J.state.activeChain);let e=B.getAuthConnector();e?.provider?.reload();let t=ae(O.state);e?.provider?.syncDappData?.({metadata:t.metadata,sdkVersion:t.sdkVersion,projectId:t.projectId,sdkType:t.sdkType})}},100)},goBackToIndex(e){if(L.history.length>1){L.history=L.history.slice(0,e+1);let[t]=L.history.slice(-1);t&&(L.view=t)}},goBackOrCloseModal(){R.state.history.length>1?R.goBack():Et.close()}}),ct=_({themeMode:`dark`,themeVariables:{},w3mThemeVariables:void 0}),lt={state:ct,subscribe(e){return v(ct,()=>e(ct))},setThemeMode(e){ct.themeMode=e;try{let t=B.getAuthConnector();if(t){let n=lt.getSnapshot().themeVariables;t.provider.syncTheme({themeMode:e,themeVariables:n,w3mThemeVariables:Fe(n,e)})}}catch{console.info(`Unable to sync theme to auth connector`)}},setThemeVariables(e){ct.themeVariables={...ct.themeVariables,...e};try{let e=B.getAuthConnector();if(e){let t=lt.getSnapshot().themeVariables;e.provider.syncTheme({themeVariables:t,w3mThemeVariables:Fe(ct.themeVariables,ct.themeMode)})}}catch{console.info(`Unable to sync theme to auth connector`)}},getSnapshot(){return ae(ct)}},ut=k(lt),dt={eip155:void 0,solana:void 0,polkadot:void 0,bip122:void 0,cosmos:void 0},z=_({allConnectors:[],connectors:[],activeConnector:void 0,filterByNamespace:void 0,activeConnectorIds:{...dt},filterByNamespaceMap:{eip155:!0,solana:!0,polkadot:!0,bip122:!0,cosmos:!0}}),B=k({state:z,subscribe(e){return v(z,()=>{e(z)})},subscribeKey(e,t){return y(z,e,t)},initialize(e){e.forEach(e=>{let t=T.getConnectedConnectorId(e);t&&B.setConnectorId(t,e)})},setActiveConnector(e){e&&(z.activeConnector=oe(e))},setConnectors(e){e.filter(e=>!z.allConnectors.some(t=>t.id===e.id&&B.getConnectorName(t.name)===B.getConnectorName(e.name)&&t.chain===e.chain)).forEach(e=>{e.type!==`MULTI_CHAIN`&&z.allConnectors.push(oe(e))});let t=B.getEnabledNamespaces(),n=B.getEnabledConnectors(t);z.connectors=B.mergeMultiChainConnectors(n)},filterByNamespaces(e){Object.keys(z.filterByNamespaceMap).forEach(e=>{z.filterByNamespaceMap[e]=!1}),e.forEach(e=>{z.filterByNamespaceMap[e]=!0}),B.updateConnectorsForEnabledNamespaces()},filterByNamespace(e,t){z.filterByNamespaceMap[e]=t,B.updateConnectorsForEnabledNamespaces()},updateConnectorsForEnabledNamespaces(){let e=B.getEnabledNamespaces(),t=B.getEnabledConnectors(e),n=B.areAllNamespacesEnabled();z.connectors=B.mergeMultiChainConnectors(t),n?I.clearFilterByNamespaces():I.filterByNamespaces(e)},getEnabledNamespaces(){return Object.entries(z.filterByNamespaceMap).filter(([e,t])=>t).map(([e])=>e)},getEnabledConnectors(e){return z.allConnectors.filter(t=>e.includes(t.chain))},areAllNamespacesEnabled(){return Object.values(z.filterByNamespaceMap).every(e=>e)},mergeMultiChainConnectors(e){let t=B.generateConnectorMapByName(e),n=[];return t.forEach(e=>{let t=e[0],r=t?.id===b.CONNECTOR_ID.AUTH;e.length>1&&t?n.push({name:t.name,imageUrl:t.imageUrl,imageId:t.imageId,connectors:[...e],type:r?`AUTH`:`MULTI_CHAIN`,chain:`eip155`,id:t?.id||``}):t&&n.push(t)}),n},generateConnectorMapByName(e){let t=new Map;return e.forEach(e=>{let{name:n}=e,r=B.getConnectorName(n);if(!r)return;let i=t.get(r)||[];i.find(t=>t.chain===e.chain)||i.push(e),t.set(r,i)}),t},getConnectorName(e){return e&&({"Trust Wallet":`Trust`}[e]||e)},getUniqueConnectorsByName(e){let t=[];return e.forEach(e=>{t.find(t=>t.chain===e.chain)||t.push(e)}),t},addConnector(e){if(e.id===b.CONNECTOR_ID.AUTH){let t=e,n=ae(O.state),r=ut.getSnapshot().themeMode,i=ut.getSnapshot().themeVariables;t?.provider?.syncDappData?.({metadata:n.metadata,sdkVersion:n.sdkVersion,projectId:n.projectId,sdkType:n.sdkType}),t?.provider?.syncTheme({themeMode:r,themeVariables:i,w3mThemeVariables:Fe(i,r)}),B.setConnectors([e])}else B.setConnectors([e])},getAuthConnector(e){let t=e||J.state.activeChain,n=z.connectors.find(e=>e.id===b.CONNECTOR_ID.AUTH);if(n)return n?.connectors?.length?n.connectors.find(e=>e.chain===t):n},getAnnouncedConnectorRdns(){return z.connectors.filter(e=>e.type===`ANNOUNCED`).map(e=>e.info?.rdns)},getConnectorById(e){return z.allConnectors.find(t=>t.id===e)},getConnector(e,t){return z.allConnectors.filter(e=>e.chain===J.state.activeChain).find(n=>n.explorerId===e||n.info?.rdns===t)},syncIfAuthConnector(e){if(e.id!==`ID_AUTH`)return;let t=e,n=ae(O.state),r=ut.getSnapshot().themeMode,i=ut.getSnapshot().themeVariables;t?.provider?.syncDappData?.({metadata:n.metadata,sdkVersion:n.sdkVersion,sdkType:n.sdkType,projectId:n.projectId}),t.provider.syncTheme({themeMode:r,themeVariables:i,w3mThemeVariables:Fe(i,r)})},getConnectorsByNamespace(e){let t=z.allConnectors.filter(t=>t.chain===e);return B.mergeMultiChainConnectors(t)},selectWalletConnector(e){let t=B.getConnector(e.id,e.rdns),n=J.state.activeChain;Xe.handleMobileDeeplinkRedirect(t?.explorerId||e.id,n),t?R.push(`ConnectingExternal`,{connector:t}):R.push(`ConnectingWalletConnect`,{wallet:e})},getConnectors(e){return e?B.getConnectorsByNamespace(e):B.mergeMultiChainConnectors(z.allConnectors)},setFilterByNamespace(e){z.filterByNamespace=e,z.connectors=B.getConnectors(e),I.setFilterByNamespace(e)},setConnectorId(e,t){e&&(z.activeConnectorIds={...z.activeConnectorIds,[t]:e},T.setConnectedConnectorId(t,e))},removeConnectorId(e){z.activeConnectorIds={...z.activeConnectorIds,[e]:void 0},T.deleteConnectedConnectorId(e)},getConnectorId(e){if(e)return z.activeConnectorIds[e]},isConnected(e){return e?!!z.activeConnectorIds[e]:Object.values(z.activeConnectorIds).some(e=>!!e)},resetConnectorIds(){z.activeConnectorIds={...dt}}});typeof process<`u`&&{}.NEXT_PUBLIC_SECURE_SITE_SDK_URL,typeof process<`u`&&{}.NEXT_PUBLIC_DEFAULT_LOG_LEVEL,typeof process<`u`&&{}.NEXT_PUBLIC_SECURE_SITE_SDK_VERSION;var ft={SAFE_RPC_METHODS:`eth_accounts.eth_blockNumber.eth_call.eth_chainId.eth_estimateGas.eth_feeHistory.eth_gasPrice.eth_getAccount.eth_getBalance.eth_getBlockByHash.eth_getBlockByNumber.eth_getBlockReceipts.eth_getBlockTransactionCountByHash.eth_getBlockTransactionCountByNumber.eth_getCode.eth_getFilterChanges.eth_getFilterLogs.eth_getLogs.eth_getProof.eth_getStorageAt.eth_getTransactionByBlockHashAndIndex.eth_getTransactionByBlockNumberAndIndex.eth_getTransactionByHash.eth_getTransactionCount.eth_getTransactionReceipt.eth_getUncleCountByBlockHash.eth_getUncleCountByBlockNumber.eth_maxPriorityFeePerGas.eth_newBlockFilter.eth_newFilter.eth_newPendingTransactionFilter.eth_sendRawTransaction.eth_syncing.eth_uninstallFilter.wallet_getCapabilities.wallet_getCallsStatus.eth_getUserOperationReceipt.eth_estimateUserOperationGas.eth_getUserOperationByHash.eth_supportedEntryPoints.wallet_getAssets`.split(`.`),NOT_SAFE_RPC_METHODS:[`personal_sign`,`eth_signTypedData_v4`,`eth_sendTransaction`,`solana_signMessage`,`solana_signTransaction`,`solana_signAllTransactions`,`solana_signAndSendTransaction`,`wallet_sendCalls`,`wallet_grantPermissions`,`wallet_revokePermissions`,`eth_sendUserOperation`],GET_CHAIN_ID:`eth_chainId`,RPC_METHOD_NOT_ALLOWED_MESSAGE:`Requested RPC call is not allowed`,RPC_METHOD_NOT_ALLOWED_UI_MESSAGE:`Action not allowed`,ACCOUNT_TYPES:{EOA:`eoa`,SMART_ACCOUNT:`smartAccount`}},pt=Object.freeze({message:``,variant:`success`,svg:void 0,open:!1,autoClose:!0}),V=_({...pt}),mt={state:V,subscribeKey(e,t){return y(V,e,t)},showLoading(e,t={}){this._showMessage({message:e,variant:`loading`,...t})},showSuccess(e){this._showMessage({message:e,variant:`success`})},showSvg(e,t){this._showMessage({message:e,svg:t})},showError(e){let t=E.parseError(e);this._showMessage({message:t,variant:`error`})},hide(){V.message=pt.message,V.variant=pt.variant,V.svg=pt.svg,V.open=pt.open,V.autoClose=pt.autoClose},_showMessage({message:e,svg:t,variant:n=`success`,autoClose:r=pt.autoClose}){V.open?(V.open=!1,setTimeout(()=>{V.message=e,V.variant=n,V.svg=t,V.open=!0,V.autoClose=r},150)):(V.message=e,V.variant=n,V.svg=t,V.open=!0,V.autoClose=r)}},H=_({transactions:[],coinbaseTransactions:{},transactionsByYear:{},lastNetworkInView:void 0,loading:!1,empty:!1,next:void 0}),ht=k({state:H,subscribe(e){return v(H,()=>e(H))},setLastNetworkInView(e){H.lastNetworkInView=e},async fetchTransactions(e,t){if(!e)throw Error(`Transactions can't be fetched without an accountAddress`);H.loading=!0;try{let n=await X.fetchTransactions({account:e,cursor:H.next,onramp:t,cache:t===`coinbase`?`no-cache`:void 0,chainId:J.state.activeCaipNetwork?.caipNetworkId}),r=ht.filterSpamTransactions(n.data),i=ht.filterByConnectedChain(r),a=[...H.transactions,...i];H.loading=!1,t===`coinbase`?H.coinbaseTransactions=ht.groupTransactionsByYearAndMonth(H.coinbaseTransactions,n.data):(H.transactions=a,H.transactionsByYear=ht.groupTransactionsByYearAndMonth(H.transactionsByYear,i)),H.empty=a.length===0,H.next=n.next?n.next:void 0}catch{let t=J.state.activeChain;N.sendEvent({type:`track`,event:`ERROR_FETCH_TRANSACTIONS`,properties:{address:e,projectId:O.state.projectId,cursor:H.next,isSmartAccount:Q.state.preferredAccountTypes?.[t]===ft.ACCOUNT_TYPES.SMART_ACCOUNT}}),mt.showError(`Failed to fetch transactions`),H.loading=!1,H.empty=!0,H.next=void 0}},groupTransactionsByYearAndMonth(e={},t=[]){let n=e;return t.forEach(e=>{let t=new Date(e.metadata.minedAt).getFullYear(),r=new Date(e.metadata.minedAt).getMonth(),i=n[t]??{},a=(i[r]??[]).filter(t=>t.id!==e.id);n[t]={...i,[r]:[...a,e].sort((e,t)=>new Date(t.metadata.minedAt).getTime()-new Date(e.metadata.minedAt).getTime())}}),n},filterSpamTransactions(e){return e.filter(e=>!e.transfers.every(e=>e.nft_info?.flags.is_spam===!0))},filterByConnectedChain(e){let t=J.state.activeCaipNetwork?.caipNetworkId;return e.filter(e=>e.metadata.chain===t)},clearCursor(){H.next=void 0},resetTransactions(){H.transactions=[],H.transactionsByYear={},H.lastNetworkInView=void 0,H.loading=!1,H.empty=!1,H.next=void 0}},`API_ERROR`),U=_({connections:new Map,wcError:!1,buffering:!1,status:`disconnected`}),gt,W=k({state:U,subscribeKey(e,t){return y(U,e,t)},_getClient(){return U._client},setClient(e){U._client=oe(e)},async connectWalletConnect(){if(E.isTelegram()||E.isSafari()&&E.isIos()){if(gt){await gt,gt=void 0;return}if(!E.isPairingExpired(U?.wcPairingExpiry)){U.wcUri=U.wcUri;return}gt=W._getClient()?.connectWalletConnect?.().catch(()=>void 0),W.state.status=`connecting`,await gt,gt=void 0,U.wcPairingExpiry=void 0,W.state.status=`connected`}else await W._getClient()?.connectWalletConnect?.()},async connectExternal(e,t,n=!0){await W._getClient()?.connectExternal?.(e),n&&J.setActiveNamespace(t)},async reconnectExternal(e){await W._getClient()?.reconnectExternal?.(e);let t=e.chain||J.state.activeChain;t&&B.setConnectorId(e.id,t)},async setPreferredAccountType(e,t){Et.setLoading(!0,J.state.activeChain);let n=B.getAuthConnector();n&&(Q.setPreferredAccountType(e,t),await n.provider.setPreferredAccount(e),T.setPreferredAccountTypes(Q.state.preferredAccountTypes??{[t]:e}),await W.reconnectExternal(n),Et.setLoading(!1,J.state.activeChain),N.sendEvent({type:`track`,event:`SET_PREFERRED_ACCOUNT_TYPE`,properties:{accountType:e,network:J.state.activeCaipNetwork?.caipNetworkId||``}}))},async signMessage(e){return W._getClient()?.signMessage(e)},parseUnits(e,t){return W._getClient()?.parseUnits(e,t)},formatUnits(e,t){return W._getClient()?.formatUnits(e,t)},async sendTransaction(e){return W._getClient()?.sendTransaction(e)},async getCapabilities(e){return W._getClient()?.getCapabilities(e)},async grantPermissions(e){return W._getClient()?.grantPermissions(e)},async walletGetAssets(e){return W._getClient()?.walletGetAssets(e)??{}},async estimateGas(e){return W._getClient()?.estimateGas(e)},async writeContract(e){return W._getClient()?.writeContract(e)},async getEnsAddress(e){return W._getClient()?.getEnsAddress(e)},async getEnsAvatar(e){return W._getClient()?.getEnsAvatar(e)},checkInstalled(e){return W._getClient()?.checkInstalled?.(e)||!1},resetWcConnection(){U.wcUri=void 0,U.wcPairingExpiry=void 0,U.wcLinking=void 0,U.recentWallet=void 0,U.status=`disconnected`,ht.resetTransactions(),T.deleteWalletConnectDeepLink()},resetUri(){U.wcUri=void 0,U.wcPairingExpiry=void 0,gt=void 0},finalizeWcConnection(){let{wcLinking:e,recentWallet:t}=W.state;e&&T.setWalletConnectDeepLink(e),t&&T.setAppKitRecent(t),N.sendEvent({type:`track`,event:`CONNECT_SUCCESS`,properties:{method:e?`mobile`:`qrcode`,name:R.state.data?.wallet?.name||`Unknown`}})},setWcBasic(e){U.wcBasic=e},setUri(e){U.wcUri=e,U.wcPairingExpiry=E.getPairingExpiry()},setWcLinking(e){U.wcLinking=e},setWcError(e){U.wcError=e,U.buffering=!1},setRecentWallet(e){U.recentWallet=e},setBuffering(e){U.buffering=e},setStatus(e){U.status=e},async disconnect(e){try{await W._getClient()?.disconnect(e)}catch(e){throw new Je(`Failed to disconnect`,`INTERNAL_SDK_ERROR`,e)}},setConnections(e,t){U.connections.set(t,e)},switchAccount({connection:e,address:t,namespace:n}){if(B.state.activeConnectorIds[n]===e.connectorId){let e=J.state.activeCaipNetwork;if(e){let r=`${n}:${e.id}:${t}`;Q.setCaipAddress(r,n)}else console.warn(`No current network found for namespace "${n}"`)}else{let t=B.getConnector(e.connectorId);t?W.connectExternal(t,n):console.warn(`No connector found for namespace "${n}"`)}}}),_t=_({loading:!1,open:!1,selectedNetworkId:void 0,activeChain:void 0,initialized:!1}),vt={state:_t,subscribe(e){return v(_t,()=>e(_t))},subscribeOpen(e){return y(_t,`open`,e)},set(e){Object.assign(_t,{..._t,...e})}},yt={createBalance(e,t){let n={name:e.metadata.name||``,symbol:e.metadata.symbol||``,decimals:e.metadata.decimals||0,value:e.metadata.value||0,price:e.metadata.price||0,iconUrl:e.metadata.iconUrl||``};return{name:n.name,symbol:n.symbol,chainId:t,address:e.address===`native`?void 0:this.convertAddressToCAIP10Address(e.address,t),value:n.value,price:n.price,quantity:{decimals:n.decimals.toString(),numeric:this.convertHexToBalance({hex:e.balance,decimals:n.decimals})},iconUrl:n.iconUrl}},convertHexToBalance({hex:t,decimals:n}){return e(BigInt(t),n)},convertAddressToCAIP10Address(e,t){return`${t}:${e}`},createCAIP2ChainId(e,t){return`${t}:${parseInt(e,16)}`},getChainIdHexFromCAIP2ChainId(e){let t=e.split(`:`);if(t.length<2||!t[1])return`0x0`;let n=t[1],r=parseInt(n,10);return isNaN(r)?`0x0`:`0x${r.toString(16)}`},isWalletGetAssetsResponse(e){return typeof e!=`object`||!e?!1:Object.values(e).every(e=>Array.isArray(e)&&e.every(e=>this.isValidAsset(e)))},isValidAsset(e){return typeof e==`object`&&!!e&&typeof e.address==`string`&&typeof e.balance==`string`&&(e.type===`ERC20`||e.type===`NATIVE`)&&typeof e.metadata==`object`&&e.metadata!==null&&typeof e.metadata.name==`string`&&typeof e.metadata.symbol==`string`&&typeof e.metadata.decimals==`number`&&typeof e.metadata.price==`number`&&typeof e.metadata.iconUrl==`string`}},bt={async getMyTokensWithBalance(e){let t=Q.state.address,n=J.state.activeCaipNetwork;if(!t||!n)return[];if(n.chainNamespace===`eip155`){let e=await this.getEIP155Balances(t,n);if(e)return this.filterLowQualityTokens(e)}let r=await X.getBalance(t,n.caipNetworkId,e);return this.filterLowQualityTokens(r.balances)},async getEIP155Balances(e,t){try{let n=yt.getChainIdHexFromCAIP2ChainId(t.caipNetworkId);if(!(await W.getCapabilities(e))?.[n]?.assetDiscovery?.supported)return null;let r=await W.walletGetAssets({account:e,chainFilter:[n]});return yt.isWalletGetAssetsResponse(r)?(r[n]||[]).map(e=>yt.createBalance(e,t.caipNetworkId)):null}catch{return null}},filterLowQualityTokens(e){return e.filter(e=>e.quantity.decimals!==`0`)},mapBalancesToSwapTokens(e){return e?.map(e=>({...e,address:e?.address?e.address:J.getActiveNetworkTokenAddress(),decimals:parseInt(e.quantity.decimals,10),logoUri:e.iconUrl,eip2612:!1}))||[]}},G=_({tokenBalances:[],loading:!1}),K=k({state:G,subscribe(e){return v(G,()=>e(G))},subscribeKey(e,t){return y(G,e,t)},setToken(e){e&&(G.token=oe(e))},setTokenAmount(e){G.sendTokenAmount=e},setReceiverAddress(e){G.receiverAddress=e},setReceiverProfileImageUrl(e){G.receiverProfileImageUrl=e},setReceiverProfileName(e){G.receiverProfileName=e},setNetworkBalanceInUsd(e){G.networkBalanceInUSD=e},setLoading(e){G.loading=e},async sendToken(){try{switch(K.setLoading(!0),J.state.activeCaipNetwork?.chainNamespace){case`eip155`:await K.sendEvmToken();return;case`solana`:await K.sendSolanaToken();return;default:throw Error(`Unsupported chain`)}}finally{K.setLoading(!1)}},async sendEvmToken(){let e=J.state.activeChain,t=Q.state.preferredAccountTypes?.[e];if(!K.state.sendTokenAmount||!K.state.receiverAddress)throw Error(`An amount and receiver address are required`);if(!K.state.token)throw Error(`A token is required`);K.state.token?.address?(N.sendEvent({type:`track`,event:`SEND_INITIATED`,properties:{isSmartAccount:t===ft.ACCOUNT_TYPES.SMART_ACCOUNT,token:K.state.token.address,amount:K.state.sendTokenAmount,network:J.state.activeCaipNetwork?.caipNetworkId||``}}),await K.sendERC20Token({receiverAddress:K.state.receiverAddress,tokenAddress:K.state.token.address,sendTokenAmount:K.state.sendTokenAmount,decimals:K.state.token.quantity.decimals})):(N.sendEvent({type:`track`,event:`SEND_INITIATED`,properties:{isSmartAccount:t===ft.ACCOUNT_TYPES.SMART_ACCOUNT,token:K.state.token.symbol||``,amount:K.state.sendTokenAmount,network:J.state.activeCaipNetwork?.caipNetworkId||``}}),await K.sendNativeToken({receiverAddress:K.state.receiverAddress,sendTokenAmount:K.state.sendTokenAmount,decimals:K.state.token.quantity.decimals}))},async fetchTokenBalance(e){G.loading=!0;let t=J.state.activeCaipNetwork?.caipNetworkId,n=J.state.activeCaipNetwork?.chainNamespace,r=J.state.activeCaipAddress,i=r?E.getPlainAddress(r):void 0;if(G.lastRetry&&!E.isAllowedRetry(G.lastRetry,30*w.ONE_SEC_MS))return G.loading=!1,[];try{if(i&&t&&n){let e=await bt.getMyTokensWithBalance();return G.tokenBalances=e,G.lastRetry=void 0,e}}catch(t){G.lastRetry=Date.now(),e?.(t),mt.showError(`Token Balance Unavailable`)}finally{G.loading=!1}return[]},fetchNetworkBalance(){if(G.tokenBalances.length===0)return;let e=bt.mapBalancesToSwapTokens(G.tokenBalances);if(!e)return;let t=e.find(e=>e.address===J.getActiveNetworkTokenAddress());t&&(G.networkBalanceInUSD=t?Oe.multiply(t.quantity.numeric,t.price).toString():`0`)},async sendNativeToken(e){R.pushTransactionStack({});let t=e.receiverAddress,n=Q.state.address,r=W.parseUnits(e.sendTokenAmount.toString(),Number(e.decimals));await W.sendTransaction({chainNamespace:`eip155`,to:t,address:n,data:`0x`,value:r??BigInt(0)}),N.sendEvent({type:`track`,event:`SEND_SUCCESS`,properties:{isSmartAccount:Q.state.preferredAccountTypes?.eip155===ft.ACCOUNT_TYPES.SMART_ACCOUNT,token:K.state.token?.symbol||``,amount:e.sendTokenAmount,network:J.state.activeCaipNetwork?.caipNetworkId||``}}),W._getClient()?.updateBalance(`eip155`),K.resetSend()},async sendERC20Token(e){R.pushTransactionStack({onSuccess(){R.replace(`Account`)}});let t=W.parseUnits(e.sendTokenAmount.toString(),Number(e.decimals));if(Q.state.address&&e.sendTokenAmount&&e.receiverAddress&&e.tokenAddress){let n=E.getPlainAddress(e.tokenAddress);await W.writeContract({fromAddress:Q.state.address,tokenAddress:n,args:[e.receiverAddress,t??BigInt(0)],method:`transfer`,abi:Me.getERC20Abi(n),chainNamespace:`eip155`}),K.resetSend()}},async sendSolanaToken(){if(!K.state.sendTokenAmount||!K.state.receiverAddress)throw Error(`An amount and receiver address are required`);R.pushTransactionStack({onSuccess(){R.replace(`Account`)}}),await W.sendTransaction({chainNamespace:`solana`,to:K.state.receiverAddress,value:K.state.sendTokenAmount}),W._getClient()?.updateBalance(`solana`),K.resetSend()},resetSend(){G.token=void 0,G.sendTokenAmount=void 0,G.receiverAddress=void 0,G.receiverProfileImageUrl=void 0,G.receiverProfileName=void 0,G.loading=!1,G.tokenBalances=[]}}),xt={currentTab:0,tokenBalance:[],smartAccountDeployed:!1,addressLabels:new Map,allAccounts:[],user:void 0},St={caipNetwork:void 0,supportsAllNetworks:!0,smartAccountEnabledNetworks:[]},q=_({chains:se(),activeCaipAddress:void 0,activeChain:void 0,activeCaipNetwork:void 0,noAdapters:!1,universalAdapter:{networkControllerClient:void 0,connectionControllerClient:void 0},isSwitchingNamespace:!1}),J=k({state:q,subscribe(e){return v(q,()=>{e(q)})},subscribeKey(e,t){return y(q,e,t)},subscribeChainProp(e,t,n){let r;return v(q.chains,()=>{let i=n||q.activeChain;if(i){let n=q.chains.get(i)?.[e];r!==n&&(r=n,t(n))}})},initialize(e,t,n){let{chainId:r,namespace:i}=T.getActiveNetworkProps(),a=t?.find(e=>e.id.toString()===r?.toString()),o=e.find(e=>e?.namespace===i)||e?.[0],s=e.map(e=>e.namespace).filter(e=>e!==void 0),c=O.state.enableEmbedded?new Set([...s]):new Set([...t?.map(e=>e.chainNamespace)??[]]);(e?.length===0||!o)&&(q.noAdapters=!0),q.noAdapters||(q.activeChain=o?.namespace,q.activeCaipNetwork=a,J.setChainNetworkData(o?.namespace,{caipNetwork:a}),q.activeChain&&vt.set({activeChain:o?.namespace})),c.forEach(e=>{let r=t?.filter(t=>t.chainNamespace===e);J.state.chains.set(e,{namespace:e,networkState:_({...St,caipNetwork:r?.[0]}),accountState:_(xt),caipNetworks:r??[],...n}),J.setRequestedCaipNetworks(r??[],e)})},removeAdapter(e){if(q.activeChain===e){let t=Array.from(q.chains.entries()).find(([t])=>t!==e);if(t){let e=t[1]?.caipNetworks?.[0];e&&J.setActiveCaipNetwork(e)}}q.chains.delete(e)},addAdapter(e,{networkControllerClient:t,connectionControllerClient:n},r){q.chains.set(e.namespace,{namespace:e.namespace,networkState:{...St,caipNetwork:r[0]},accountState:xt,caipNetworks:r,connectionControllerClient:n,networkControllerClient:t}),J.setRequestedCaipNetworks(r?.filter(t=>t.chainNamespace===e.namespace)??[],e.namespace)},addNetwork(e){let t=q.chains.get(e.chainNamespace);if(t){let n=[...t.caipNetworks||[]];t.caipNetworks?.find(t=>t.id===e.id)||n.push(e),q.chains.set(e.chainNamespace,{...t,caipNetworks:n}),J.setRequestedCaipNetworks(n,e.chainNamespace),B.filterByNamespace(e.chainNamespace,!0)}},removeNetwork(e,t){let n=q.chains.get(e);if(n){let r=q.activeCaipNetwork?.id===t,i=[...n.caipNetworks?.filter(e=>e.id!==t)||[]];r&&n?.caipNetworks?.[0]&&J.setActiveCaipNetwork(n.caipNetworks[0]),q.chains.set(e,{...n,caipNetworks:i}),J.setRequestedCaipNetworks(i||[],e),i.length===0&&B.filterByNamespace(e,!1)}},setAdapterNetworkState(e,t){let n=q.chains.get(e);n&&(n.networkState={...n.networkState||St,...t},q.chains.set(e,n))},setChainAccountData(e,t,n=!0){if(!e)throw Error(`Chain is required to update chain account data`);let r=q.chains.get(e);if(r){let n={...r.accountState||xt,...t};q.chains.set(e,{...r,accountState:n}),(q.chains.size===1||q.activeChain===e)&&(t.caipAddress&&(q.activeCaipAddress=t.caipAddress),Q.replaceState(n))}},setChainNetworkData(e,t){if(!e)return;let n=q.chains.get(e);if(n){let r={...n.networkState||St,...t};q.chains.set(e,{...n,networkState:r})}},setAccountProp(e,t,n,r=!0){J.setChainAccountData(n,{[e]:t},r),e===`status`&&t===`disconnected`&&n&&B.removeConnectorId(n)},setActiveNamespace(e){q.activeChain=e;let t=e?q.chains.get(e):void 0,n=t?.networkState?.caipNetwork;n?.id&&e&&(q.activeCaipAddress=t?.accountState?.caipAddress,q.activeCaipNetwork=n,J.setChainNetworkData(e,{caipNetwork:n}),T.setActiveCaipNetworkId(n?.caipNetworkId),vt.set({activeChain:e,selectedNetworkId:n?.caipNetworkId}))},setActiveCaipNetwork(e){if(!e)return;q.activeChain!==e.chainNamespace&&J.setIsSwitchingNamespace(!0);let t=q.chains.get(e.chainNamespace);q.activeChain=e.chainNamespace,q.activeCaipNetwork=e,J.setChainNetworkData(e.chainNamespace,{caipNetwork:e}),t?.accountState?.address?q.activeCaipAddress=`${e.chainNamespace}:${e.id}:${t?.accountState?.address}`:q.activeCaipAddress=void 0,J.setAccountProp(`caipAddress`,q.activeCaipAddress,e.chainNamespace),t&&Q.replaceState(t.accountState),K.resetSend(),vt.set({activeChain:q.activeChain,selectedNetworkId:q.activeCaipNetwork?.caipNetworkId}),T.setActiveCaipNetworkId(e.caipNetworkId),!J.checkIfSupportedNetwork(e.chainNamespace)&&O.state.enableNetworkSwitch&&!O.state.allowUnsupportedChain&&!W.state.wcBasic&&J.showUnsupportedChainUI()},addCaipNetwork(e){if(!e)return;let t=q.chains.get(e.chainNamespace);t&&t?.caipNetworks?.push(e)},async switchActiveNamespace(e){if(!e)return;let t=e!==J.state.activeChain,n=J.getNetworkData(e)?.caipNetwork,r=J.getCaipNetworkByNamespace(e,n?.id);t&&r&&await J.switchActiveNetwork(r)},async switchActiveNetwork(e){let t=!J.state.chains.get(J.state.activeChain)?.caipNetworks?.some(e=>e.id===q.activeCaipNetwork?.id),n=J.getNetworkControllerClient(e.chainNamespace);if(n){try{await n.switchCaipNetwork(e),t&&Et.close()}catch{R.goBack()}N.sendEvent({type:`track`,event:`SWITCH_NETWORK`,properties:{network:e.caipNetworkId}})}},getNetworkControllerClient(e){let t=e||q.activeChain,n=q.chains.get(t);if(!n)throw Error(`Chain adapter not found`);if(!n.networkControllerClient)throw Error(`NetworkController client not set`);return n.networkControllerClient},getConnectionControllerClient(e){let t=e||q.activeChain;if(!t)throw Error(`Chain is required to get connection controller client`);let n=q.chains.get(t);if(!n?.connectionControllerClient)throw Error(`ConnectionController client not set`);return n.connectionControllerClient},getAccountProp(e,t){let n=q.activeChain;if(t&&(n=t),!n)return;let r=q.chains.get(n)?.accountState;if(r)return r[e]},getNetworkProp(e,t){let n=q.chains.get(t)?.networkState;if(n)return n[e]},getRequestedCaipNetworks(e){let{approvedCaipNetworkIds:t=[],requestedCaipNetworks:n=[]}=q.chains.get(e)?.networkState||{};return E.sortRequestedNetworks(t,n)},getAllRequestedCaipNetworks(){let e=[];return q.chains.forEach(t=>{let n=J.getRequestedCaipNetworks(t.namespace);e.push(...n)}),e},setRequestedCaipNetworks(e,t){J.setAdapterNetworkState(t,{requestedCaipNetworks:e});let n=J.getAllRequestedCaipNetworks().map(e=>e.chainNamespace),r=Array.from(new Set(n));B.filterByNamespaces(r)},getAllApprovedCaipNetworkIds(){let e=[];return q.chains.forEach(t=>{let n=J.getApprovedCaipNetworkIds(t.namespace);e.push(...n)}),e},getActiveCaipNetwork(){return q.activeCaipNetwork},getActiveCaipAddress(){return q.activeCaipAddress},getApprovedCaipNetworkIds(e){return q.chains.get(e)?.networkState?.approvedCaipNetworkIds||[]},async setApprovedCaipNetworksData(e){let t=await J.getNetworkControllerClient()?.getApprovedCaipNetworksData();J.setAdapterNetworkState(e,{approvedCaipNetworkIds:t?.approvedCaipNetworkIds,supportsAllNetworks:t?.supportsAllNetworks})},checkIfSupportedNetwork(e,t){let n=t||q.activeCaipNetwork,r=J.getRequestedCaipNetworks(e);return r.length?r?.some(e=>e.id===n?.id):!0},checkIfSupportedChainId(e){return q.activeChain?J.getRequestedCaipNetworks(q.activeChain)?.some(t=>t.id===e):!0},setSmartAccountEnabledNetworks(e,t){J.setAdapterNetworkState(t,{smartAccountEnabledNetworks:e})},checkIfSmartAccountEnabled(){let e=ce.caipNetworkIdToNumber(q.activeCaipNetwork?.caipNetworkId),t=q.activeChain;return!t||!e?!1:!!J.getNetworkProp(`smartAccountEnabledNetworks`,t)?.includes(Number(e))},getActiveNetworkTokenAddress(){let e=q.activeCaipNetwork?.chainNamespace||`eip155`;return`${e}:${q.activeCaipNetwork?.id||1}:${w.NATIVE_TOKEN_ADDRESS[e]}`},showUnsupportedChainUI(){Et.open({view:`UnsupportedChain`})},checkIfNamesSupported(){let e=q.activeCaipNetwork;return!!(e?.chainNamespace&&w.NAMES_SUPPORTED_CHAIN_NAMESPACES.includes(e.chainNamespace))},resetNetwork(e){J.setAdapterNetworkState(e,{approvedCaipNetworkIds:void 0,supportsAllNetworks:!0,smartAccountEnabledNetworks:[]})},resetAccount(e){let t=e;if(!t)throw Error(`Chain is required to set account prop`);q.activeCaipAddress=void 0,J.setChainAccountData(t,{smartAccountDeployed:!1,currentTab:0,caipAddress:void 0,address:void 0,balance:void 0,balanceSymbol:void 0,profileName:void 0,profileImage:void 0,addressExplorerUrl:void 0,tokenBalance:[],connectedWalletInfo:void 0,preferredAccountTypes:void 0,socialProvider:void 0,socialWindow:void 0,farcasterUrl:void 0,allAccounts:[],user:void 0,status:`disconnected`}),B.removeConnectorId(t)},setIsSwitchingNamespace(e){q.isSwitchingNamespace=e},getFirstCaipNetworkSupportsAuthConnector(){let e=[],t;if(q.chains.forEach(t=>{b.AUTH_CONNECTOR_SUPPORTED_CHAINS.find(e=>e===t.namespace)&&t.namespace&&e.push(t.namespace)}),e.length>0){let n=e[0];return t=n?q.chains.get(n)?.caipNetworks?.[0]:void 0,t}},getAccountData(e){return e?J.state.chains.get(e)?.accountState:Q.state},getNetworkData(e){let t=e||q.activeChain;if(t)return J.state.chains.get(t)?.networkState},getCaipNetworkByNamespace(e,t){if(!e)return;let n=J.state.chains.get(e);return n?.caipNetworks?.find(e=>e.id===t)||n?.networkState?.caipNetwork||n?.caipNetworks?.[0]},getRequestedCaipNetworkIds(){let e=B.state.filterByNamespace;return(e?[q.chains.get(e)]:Array.from(q.chains.values())).flatMap(e=>e?.caipNetworks||[]).map(e=>e.caipNetworkId)},getCaipNetworks(e){return e?J.getRequestedCaipNetworks(e):J.getAllRequestedCaipNetworks()}}),Ct={purchaseCurrencies:[{id:`2b92315d-eab7-5bef-84fa-089a131333f5`,name:`USD Coin`,symbol:`USDC`,networks:[{name:`ethereum-mainnet`,display_name:`Ethereum`,chain_id:`1`,contract_address:`0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`},{name:`polygon-mainnet`,display_name:`Polygon`,chain_id:`137`,contract_address:`0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`}]},{id:`2b92315d-eab7-5bef-84fa-089a131333f5`,name:`Ether`,symbol:`ETH`,networks:[{name:`ethereum-mainnet`,display_name:`Ethereum`,chain_id:`1`,contract_address:`0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`},{name:`polygon-mainnet`,display_name:`Polygon`,chain_id:`137`,contract_address:`0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`}]}],paymentCurrencies:[{id:`USD`,payment_method_limits:[{id:`card`,min:`10.00`,max:`7500.00`},{id:`ach_bank_account`,min:`10.00`,max:`25000.00`}]},{id:`EUR`,payment_method_limits:[{id:`card`,min:`10.00`,max:`7500.00`},{id:`ach_bank_account`,min:`10.00`,max:`25000.00`}]}]},wt=E.getBlockchainApiUrl(),Y=_({clientId:null,api:new Be({baseUrl:wt,clientId:null}),supportedChains:{http:[],ws:[]}}),X={state:Y,async get(e){let{st:t,sv:n}=X.getSdkProperties(),r=O.state.projectId,i={...e.params||{},st:t,sv:n,projectId:r};return Y.api.get({...e,params:i})},getSdkProperties(){let{sdkType:e,sdkVersion:t}=O.state;return{st:e||`unknown`,sv:t||`unknown`}},async isNetworkSupported(e){if(!e)return!1;try{Y.supportedChains.http.length||await X.getSupportedNetworks()}catch{return!1}return Y.supportedChains.http.includes(e)},async getSupportedNetworks(){try{let e=await X.get({path:`v1/supported-chains`});return Y.supportedChains=e,e}catch{return Y.supportedChains}},async fetchIdentity({address:e,caipNetworkId:t}){if(!await X.isNetworkSupported(t))return{avatar:``,name:``};let n=T.getIdentityFromCacheForAddress(e);if(n)return n;let r=await X.get({path:`/v1/identity/${e}`,params:{sender:J.state.activeCaipAddress?E.getPlainAddress(J.state.activeCaipAddress):void 0}});return T.updateIdentityCache({address:e,identity:r,timestamp:Date.now()}),r},async fetchTransactions({account:e,cursor:t,onramp:n,signal:r,cache:i,chainId:a}){return await X.isNetworkSupported(J.state.activeCaipNetwork?.caipNetworkId)?X.get({path:`/v1/account/${e}/history`,params:{cursor:t,onramp:n,chainId:a},signal:r,cache:i}):{data:[],next:void 0}},async fetchSwapQuote({amount:e,userAddress:t,from:n,to:r,gasPrice:i}){return await X.isNetworkSupported(J.state.activeCaipNetwork?.caipNetworkId)?X.get({path:`/v1/convert/quotes`,headers:{"Content-Type":`application/json`},params:{amount:e,userAddress:t,from:n,to:r,gasPrice:i}}):{quotes:[]}},async fetchSwapTokens({chainId:e}){return await X.isNetworkSupported(J.state.activeCaipNetwork?.caipNetworkId)?X.get({path:`/v1/convert/tokens`,params:{chainId:e}}):{tokens:[]}},async fetchTokenPrice({addresses:e}){return await X.isNetworkSupported(J.state.activeCaipNetwork?.caipNetworkId)?Y.api.post({path:`/v1/fungible/price`,body:{currency:`usd`,addresses:e,projectId:O.state.projectId},headers:{"Content-Type":`application/json`}}):{fungibles:[]}},async fetchSwapAllowance({tokenAddress:e,userAddress:t}){return await X.isNetworkSupported(J.state.activeCaipNetwork?.caipNetworkId)?X.get({path:`/v1/convert/allowance`,params:{tokenAddress:e,userAddress:t},headers:{"Content-Type":`application/json`}}):{allowance:`0`}},async fetchGasPrice({chainId:e}){let{st:t,sv:n}=X.getSdkProperties();if(!await X.isNetworkSupported(J.state.activeCaipNetwork?.caipNetworkId))throw Error(`Network not supported for Gas Price`);return X.get({path:`/v1/convert/gas-price`,headers:{"Content-Type":`application/json`},params:{chainId:e,st:t,sv:n}})},async generateSwapCalldata({amount:e,from:t,to:n,userAddress:r,disableEstimate:i}){if(!await X.isNetworkSupported(J.state.activeCaipNetwork?.caipNetworkId))throw Error(`Network not supported for Swaps`);return Y.api.post({path:`/v1/convert/build-transaction`,headers:{"Content-Type":`application/json`},body:{amount:e,eip155:{slippage:w.CONVERT_SLIPPAGE_TOLERANCE},projectId:O.state.projectId,from:t,to:n,userAddress:r,disableEstimate:i}})},async generateApproveCalldata({from:e,to:t,userAddress:n}){let{st:r,sv:i}=X.getSdkProperties();if(!await X.isNetworkSupported(J.state.activeCaipNetwork?.caipNetworkId))throw Error(`Network not supported for Swaps`);return X.get({path:`/v1/convert/build-approve`,headers:{"Content-Type":`application/json`},params:{userAddress:n,from:e,to:t,st:r,sv:i}})},async getBalance(e,t,n){let{st:r,sv:i}=X.getSdkProperties();if(!await X.isNetworkSupported(J.state.activeCaipNetwork?.caipNetworkId))return mt.showError(`Token Balance Unavailable`),{balances:[]};let a=`${t}:${e}`,o=T.getBalanceCacheForCaipAddress(a);if(o)return o;let s=await X.get({path:`/v1/account/${e}/balance`,params:{currency:`usd`,chainId:t,forceUpdate:n,st:r,sv:i}});return T.updateBalanceCache({caipAddress:a,balance:s,timestamp:Date.now()}),s},async lookupEnsName(e){return await X.isNetworkSupported(J.state.activeCaipNetwork?.caipNetworkId)?X.get({path:`/v1/profile/account/${e}`,params:{apiVersion:`2`}}):{addresses:{},attributes:[]}},async reverseLookupEnsName({address:e}){return await X.isNetworkSupported(J.state.activeCaipNetwork?.caipNetworkId)?X.get({path:`/v1/profile/reverse/${e}`,params:{sender:Q.state.address,apiVersion:`2`}}):[]},async getEnsNameSuggestions(e){return await X.isNetworkSupported(J.state.activeCaipNetwork?.caipNetworkId)?X.get({path:`/v1/profile/suggestions/${e}`,params:{zone:`reown.id`}}):{suggestions:[]}},async registerEnsName({coinType:e,address:t,message:n,signature:r}){return await X.isNetworkSupported(J.state.activeCaipNetwork?.caipNetworkId)?Y.api.post({path:`/v1/profile/account`,body:{coin_type:e,address:t,message:n,signature:r},headers:{"Content-Type":`application/json`}}):{success:!1}},async generateOnRampURL({destinationWallets:e,partnerUserId:t,defaultNetwork:n,purchaseAmount:r,paymentAmount:i}){return await X.isNetworkSupported(J.state.activeCaipNetwork?.caipNetworkId)?(await Y.api.post({path:`/v1/generators/onrampurl`,params:{projectId:O.state.projectId},body:{destinationWallets:e,defaultNetwork:n,partnerUserId:t,defaultExperience:`buy`,presetCryptoAmount:r,presetFiatAmount:i}})).url:``},async getOnrampOptions(){if(!await X.isNetworkSupported(J.state.activeCaipNetwork?.caipNetworkId))return{paymentCurrencies:[],purchaseCurrencies:[]};try{return await X.get({path:`/v1/onramp/options`})}catch{return Ct}},async getOnrampQuote({purchaseCurrency:e,paymentCurrency:t,amount:n,network:r}){try{return await X.isNetworkSupported(J.state.activeCaipNetwork?.caipNetworkId)?await Y.api.post({path:`/v1/onramp/quote`,params:{projectId:O.state.projectId},body:{purchaseCurrency:e,paymentCurrency:t,amount:n,network:r}}):null}catch{return{coinbaseFee:{amount:n,currency:t.id},networkFee:{amount:n,currency:t.id},paymentSubtotal:{amount:n,currency:t.id},paymentTotal:{amount:n,currency:t.id},purchaseAmount:{amount:n,currency:t.id},quoteId:`mocked-quote-id`}}},async getSmartSessions(e){return await X.isNetworkSupported(J.state.activeCaipNetwork?.caipNetworkId)?X.get({path:`/v1/sessions/${e}`}):[]},async revokeSmartSession(e,t,n){return await X.isNetworkSupported(J.state.activeCaipNetwork?.caipNetworkId)?Y.api.post({path:`/v1/sessions/${e}/revoke`,params:{projectId:O.state.projectId},body:{pci:t,signature:n}}):{success:!1}},setClientId(e){Y.clientId=e,Y.api=new Be({baseUrl:wt,clientId:e})}},Z=_({currentTab:0,tokenBalance:[],smartAccountDeployed:!1,addressLabels:new Map,allAccounts:[]}),Q=k({state:Z,replaceState(e){e&&Object.assign(Z,oe(e))},subscribe(e){return J.subscribeChainProp(`accountState`,t=>{if(t)return e(t)})},subscribeKey(e,t,n){let r;return J.subscribeChainProp(`accountState`,n=>{if(n){let i=n[e];r!==i&&(r=i,t(i))}},n)},setStatus(e,t){J.setAccountProp(`status`,e,t)},getCaipAddress(e){return J.getAccountProp(`caipAddress`,e)},setCaipAddress(e,t){let n=e?E.getPlainAddress(e):void 0;t===J.state.activeChain&&(J.state.activeCaipAddress=e),J.setAccountProp(`caipAddress`,e,t),J.setAccountProp(`address`,n,t)},setBalance(e,t,n){J.setAccountProp(`balance`,e,n),J.setAccountProp(`balanceSymbol`,t,n)},setProfileName(e,t){J.setAccountProp(`profileName`,e,t)},setProfileImage(e,t){J.setAccountProp(`profileImage`,e,t)},setUser(e,t){J.setAccountProp(`user`,e,t)},setAddressExplorerUrl(e,t){J.setAccountProp(`addressExplorerUrl`,e,t)},setSmartAccountDeployed(e,t){J.setAccountProp(`smartAccountDeployed`,e,t)},setCurrentTab(e){J.setAccountProp(`currentTab`,e,J.state.activeChain)},setTokenBalance(e,t){e&&J.setAccountProp(`tokenBalance`,e,t)},setShouldUpdateToAddress(e,t){J.setAccountProp(`shouldUpdateToAddress`,e,t)},setAllAccounts(e,t){J.setAccountProp(`allAccounts`,e,t)},addAddressLabel(e,t,n){let r=J.getAccountProp(`addressLabels`,n)||new Map;r.set(e,t),J.setAccountProp(`addressLabels`,r,n)},removeAddressLabel(e,t){let n=J.getAccountProp(`addressLabels`,t)||new Map;n.delete(e),J.setAccountProp(`addressLabels`,n,t)},setConnectedWalletInfo(e,t){J.setAccountProp(`connectedWalletInfo`,e,t,!1)},setPreferredAccountType(e,t){J.setAccountProp(`preferredAccountTypes`,{...Z.preferredAccountTypes,[t]:e},t)},setPreferredAccountTypes(e){Z.preferredAccountTypes=e},setSocialProvider(e,t){e&&J.setAccountProp(`socialProvider`,e,t)},setSocialWindow(e,t){J.setAccountProp(`socialWindow`,e?oe(e):void 0,t)},setFarcasterUrl(e,t){J.setAccountProp(`farcasterUrl`,e,t)},async fetchTokenBalance(e){Z.balanceLoading=!0;let t=J.state.activeCaipNetwork?.caipNetworkId,n=J.state.activeCaipNetwork?.chainNamespace,r=J.state.activeCaipAddress,i=r?E.getPlainAddress(r):void 0;if(Z.lastRetry&&!E.isAllowedRetry(Z.lastRetry,30*w.ONE_SEC_MS))return Z.balanceLoading=!1,[];try{if(i&&t&&n){let e=(await X.getBalance(i,t)).balances.filter(e=>e.quantity.decimals!==`0`);return Q.setTokenBalance(e,n),Z.lastRetry=void 0,Z.balanceLoading=!1,e}}catch(t){Z.lastRetry=Date.now(),e?.(t),mt.showError(`Token Balance Unavailable`)}finally{Z.balanceLoading=!1}return[]},resetAccount(e){J.resetAccount(e)}}),Tt={onSwitchNetwork({network:e,ignoreSwitchConfirmation:t=!1}){let n=J.state.activeCaipNetwork,r=R.state.data;if(e.id===n?.id)return;let i=Q.getCaipAddress(J.state.activeChain),a=e.chainNamespace!==J.state.activeChain,o=Q.getCaipAddress(e.chainNamespace),s=B.getConnectorId(J.state.activeChain)===b.CONNECTOR_ID.AUTH,c=b.AUTH_CONNECTOR_SUPPORTED_CHAINS.find(t=>t===e.chainNamespace);t||s&&c?R.push(`SwitchNetwork`,{...r,network:e}):i&&a&&!o?R.push(`SwitchActiveChain`,{switchToChain:e.chainNamespace,navigateTo:`Connect`,navigateWithReplace:!0,network:e}):R.push(`SwitchNetwork`,{...r,network:e})}},$=_({loading:!1,loadingNamespaceMap:new Map,open:!1,shake:!1,namespace:void 0}),Et=k({state:$,subscribe(e){return v($,()=>e($))},subscribeKey(e,t){return y($,e,t)},async open(e){let t=Q.state.status===`connected`,n=e?.namespace,r=J.state.activeChain,i=n&&n!==r,a=J.getAccountData(e?.namespace)?.caipAddress;if(W.state.wcBasic?I.prefetch({fetchNetworkImages:!1,fetchConnectorImages:!1}):await I.prefetch({fetchConnectorImages:!t,fetchFeaturedWallets:!t,fetchRecommendedWallets:!t}),B.setFilterByNamespace(e?.namespace),Et.setLoading(!0,n),n&&i){let e=J.getNetworkData(n)?.caipNetwork||J.getRequestedCaipNetworks(n)[0];e&&Tt.onSwitchNetwork({network:e,ignoreSwitchConfirmation:!0})}else{let t=J.state.noAdapters;O.state.manualWCControl||t&&!a?E.isMobile()?R.reset(`AllWallets`):R.reset(`ConnectingWalletConnectBasic`):e?.view?R.reset(e.view,e.data):a?R.reset(`Account`):R.reset(`Connect`)}$.open=!0,vt.set({open:!0}),N.sendEvent({type:`track`,event:`MODAL_OPEN`,properties:{connected:!!a}})},close(){let e=O.state.enableEmbedded,t=!!J.state.activeCaipAddress;$.open&&N.sendEvent({type:`track`,event:`MODAL_CLOSE`,properties:{connected:t}}),$.open=!1,R.reset(`Connect`),Et.clearLoading(),e?t?R.replace(`Account`):R.push(`Connect`):vt.set({open:!1}),W.resetUri()},setLoading(e,t){t&&$.loadingNamespaceMap.set(t,e),$.loading=e,vt.set({loading:e})},clearLoading(){$.loadingNamespaceMap.clear(),$.loading=!1},shake(){$.shake||($.shake=!0,setTimeout(()=>{$.shake=!1},500))}}),Dt=void 0,Ot=void 0,kt=void 0;function At(e,t){Dt=document.createElement(`style`),Ot=document.createElement(`style`),kt=document.createElement(`style`),Dt.textContent=Nt(e).core.cssText,Ot.textContent=Nt(e).dark.cssText,kt.textContent=Nt(e).light.cssText,document.head.appendChild(Dt),document.head.appendChild(Ot),document.head.appendChild(kt),jt(t)}function jt(e){Ot&&kt&&(e===`light`?(Ot.removeAttribute(`media`),kt.media=`enabled`):(kt.removeAttribute(`media`),Ot.media=`enabled`))}function Mt(e){Dt&&Ot&&kt&&(Dt.textContent=Nt(e).core.cssText,Ot.textContent=Nt(e).dark.cssText,kt.textContent=Nt(e).light.cssText)}function Nt(e){return{core:t`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      @keyframes w3m-shake {
        0% {
          transform: scale(1) rotate(0deg);
        }
        20% {
          transform: scale(1) rotate(-1deg);
        }
        40% {
          transform: scale(1) rotate(1.5deg);
        }
        60% {
          transform: scale(1) rotate(-1.5deg);
        }
        80% {
          transform: scale(1) rotate(1deg);
        }
        100% {
          transform: scale(1) rotate(0deg);
        }
      }
      @keyframes w3m-iframe-fade-out {
        0% {
          opacity: 1;
        }
        100% {
          opacity: 0;
        }
      }
      @keyframes w3m-iframe-zoom-in {
        0% {
          transform: translateY(50px);
          opacity: 0;
        }
        100% {
          transform: translateY(0px);
          opacity: 1;
        }
      }
      @keyframes w3m-iframe-zoom-in-mobile {
        0% {
          transform: scale(0.95);
          opacity: 0;
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }
      :root {
        --w3m-modal-width: 360px;
        --w3m-color-mix-strength: ${n(e?.[`--w3m-color-mix-strength`]?`${e[`--w3m-color-mix-strength`]}%`:`0%`)};
        --w3m-font-family: ${n(e?.[`--w3m-font-family`]||`Inter, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;`)};
        --w3m-font-size-master: ${n(e?.[`--w3m-font-size-master`]||`10px`)};
        --w3m-border-radius-master: ${n(e?.[`--w3m-border-radius-master`]||`4px`)};
        --w3m-z-index: ${n(e?.[`--w3m-z-index`]||999)};

        --wui-font-family: var(--w3m-font-family);

        --wui-font-size-mini: calc(var(--w3m-font-size-master) * 0.8);
        --wui-font-size-micro: var(--w3m-font-size-master);
        --wui-font-size-tiny: calc(var(--w3m-font-size-master) * 1.2);
        --wui-font-size-small: calc(var(--w3m-font-size-master) * 1.4);
        --wui-font-size-paragraph: calc(var(--w3m-font-size-master) * 1.6);
        --wui-font-size-medium: calc(var(--w3m-font-size-master) * 1.8);
        --wui-font-size-large: calc(var(--w3m-font-size-master) * 2);
        --wui-font-size-title-6: calc(var(--w3m-font-size-master) * 2.2);
        --wui-font-size-medium-title: calc(var(--w3m-font-size-master) * 2.4);
        --wui-font-size-2xl: calc(var(--w3m-font-size-master) * 4);

        --wui-border-radius-5xs: var(--w3m-border-radius-master);
        --wui-border-radius-4xs: calc(var(--w3m-border-radius-master) * 1.5);
        --wui-border-radius-3xs: calc(var(--w3m-border-radius-master) * 2);
        --wui-border-radius-xxs: calc(var(--w3m-border-radius-master) * 3);
        --wui-border-radius-xs: calc(var(--w3m-border-radius-master) * 4);
        --wui-border-radius-s: calc(var(--w3m-border-radius-master) * 5);
        --wui-border-radius-m: calc(var(--w3m-border-radius-master) * 7);
        --wui-border-radius-l: calc(var(--w3m-border-radius-master) * 9);
        --wui-border-radius-3xl: calc(var(--w3m-border-radius-master) * 20);

        --wui-font-weight-light: 400;
        --wui-font-weight-regular: 500;
        --wui-font-weight-medium: 600;
        --wui-font-weight-bold: 700;

        --wui-letter-spacing-2xl: -1.6px;
        --wui-letter-spacing-medium-title: -0.96px;
        --wui-letter-spacing-title-6: -0.88px;
        --wui-letter-spacing-large: -0.8px;
        --wui-letter-spacing-medium: -0.72px;
        --wui-letter-spacing-paragraph: -0.64px;
        --wui-letter-spacing-small: -0.56px;
        --wui-letter-spacing-tiny: -0.48px;
        --wui-letter-spacing-micro: -0.2px;
        --wui-letter-spacing-mini: -0.16px;

        --wui-spacing-0: 0px;
        --wui-spacing-4xs: 2px;
        --wui-spacing-3xs: 4px;
        --wui-spacing-xxs: 6px;
        --wui-spacing-2xs: 7px;
        --wui-spacing-xs: 8px;
        --wui-spacing-1xs: 10px;
        --wui-spacing-s: 12px;
        --wui-spacing-m: 14px;
        --wui-spacing-l: 16px;
        --wui-spacing-2l: 18px;
        --wui-spacing-xl: 20px;
        --wui-spacing-xxl: 24px;
        --wui-spacing-2xl: 32px;
        --wui-spacing-3xl: 40px;
        --wui-spacing-4xl: 90px;
        --wui-spacing-5xl: 95px;

        --wui-icon-box-size-xxs: 14px;
        --wui-icon-box-size-xs: 20px;
        --wui-icon-box-size-sm: 24px;
        --wui-icon-box-size-md: 32px;
        --wui-icon-box-size-mdl: 36px;
        --wui-icon-box-size-lg: 40px;
        --wui-icon-box-size-2lg: 48px;
        --wui-icon-box-size-xl: 64px;

        --wui-icon-size-inherit: inherit;
        --wui-icon-size-xxs: 10px;
        --wui-icon-size-xs: 12px;
        --wui-icon-size-sm: 14px;
        --wui-icon-size-md: 16px;
        --wui-icon-size-mdl: 18px;
        --wui-icon-size-lg: 20px;
        --wui-icon-size-xl: 24px;
        --wui-icon-size-xxl: 28px;

        --wui-wallet-image-size-inherit: inherit;
        --wui-wallet-image-size-sm: 40px;
        --wui-wallet-image-size-md: 56px;
        --wui-wallet-image-size-lg: 80px;

        --wui-visual-size-size-inherit: inherit;
        --wui-visual-size-sm: 40px;
        --wui-visual-size-md: 55px;
        --wui-visual-size-lg: 80px;

        --wui-box-size-md: 100px;
        --wui-box-size-lg: 120px;

        --wui-ease-out-power-2: cubic-bezier(0, 0, 0.22, 1);
        --wui-ease-out-power-1: cubic-bezier(0, 0, 0.55, 1);

        --wui-ease-in-power-3: cubic-bezier(0.66, 0, 1, 1);
        --wui-ease-in-power-2: cubic-bezier(0.45, 0, 1, 1);
        --wui-ease-in-power-1: cubic-bezier(0.3, 0, 1, 1);

        --wui-ease-inout-power-1: cubic-bezier(0.45, 0, 0.55, 1);

        --wui-duration-lg: 200ms;
        --wui-duration-md: 125ms;
        --wui-duration-sm: 75ms;

        --wui-path-network-sm: path(
          'M15.4 2.1a5.21 5.21 0 0 1 5.2 0l11.61 6.7a5.21 5.21 0 0 1 2.61 4.52v13.4c0 1.87-1 3.59-2.6 4.52l-11.61 6.7c-1.62.93-3.6.93-5.22 0l-11.6-6.7a5.21 5.21 0 0 1-2.61-4.51v-13.4c0-1.87 1-3.6 2.6-4.52L15.4 2.1Z'
        );

        --wui-path-network-md: path(
          'M43.4605 10.7248L28.0485 1.61089C25.5438 0.129705 22.4562 0.129705 19.9515 1.61088L4.53951 10.7248C2.03626 12.2051 0.5 14.9365 0.5 17.886V36.1139C0.5 39.0635 2.03626 41.7949 4.53951 43.2752L19.9515 52.3891C22.4562 53.8703 25.5438 53.8703 28.0485 52.3891L43.4605 43.2752C45.9637 41.7949 47.5 39.0635 47.5 36.114V17.8861C47.5 14.9365 45.9637 12.2051 43.4605 10.7248Z'
        );

        --wui-path-network-lg: path(
          'M78.3244 18.926L50.1808 2.45078C45.7376 -0.150261 40.2624 -0.150262 35.8192 2.45078L7.6756 18.926C3.23322 21.5266 0.5 26.3301 0.5 31.5248V64.4752C0.5 69.6699 3.23322 74.4734 7.6756 77.074L35.8192 93.5492C40.2624 96.1503 45.7376 96.1503 50.1808 93.5492L78.3244 77.074C82.7668 74.4734 85.5 69.6699 85.5 64.4752V31.5248C85.5 26.3301 82.7668 21.5266 78.3244 18.926Z'
        );

        --wui-width-network-sm: 36px;
        --wui-width-network-md: 48px;
        --wui-width-network-lg: 86px;

        --wui-height-network-sm: 40px;
        --wui-height-network-md: 54px;
        --wui-height-network-lg: 96px;

        --wui-icon-size-network-xs: 12px;
        --wui-icon-size-network-sm: 16px;
        --wui-icon-size-network-md: 24px;
        --wui-icon-size-network-lg: 42px;

        --wui-color-inherit: inherit;

        --wui-color-inverse-100: #fff;
        --wui-color-inverse-000: #000;

        --wui-cover: rgba(20, 20, 20, 0.8);

        --wui-color-modal-bg: var(--wui-color-modal-bg-base);

        --wui-color-accent-100: var(--wui-color-accent-base-100);
        --wui-color-accent-090: var(--wui-color-accent-base-090);
        --wui-color-accent-080: var(--wui-color-accent-base-080);

        --wui-color-success-100: var(--wui-color-success-base-100);
        --wui-color-success-125: var(--wui-color-success-base-125);

        --wui-color-warning-100: var(--wui-color-warning-base-100);

        --wui-color-error-100: var(--wui-color-error-base-100);
        --wui-color-error-125: var(--wui-color-error-base-125);

        --wui-color-blue-100: var(--wui-color-blue-base-100);
        --wui-color-blue-90: var(--wui-color-blue-base-90);

        --wui-icon-box-bg-error-100: var(--wui-icon-box-bg-error-base-100);
        --wui-icon-box-bg-blue-100: var(--wui-icon-box-bg-blue-base-100);
        --wui-icon-box-bg-success-100: var(--wui-icon-box-bg-success-base-100);
        --wui-icon-box-bg-inverse-100: var(--wui-icon-box-bg-inverse-base-100);

        --wui-all-wallets-bg-100: var(--wui-all-wallets-bg-100);

        --wui-avatar-border: var(--wui-avatar-border-base);

        --wui-thumbnail-border: var(--wui-thumbnail-border-base);

        --wui-wallet-button-bg: var(--wui-wallet-button-bg-base);

        --wui-box-shadow-blue: var(--wui-color-accent-glass-020);
      }

      @supports (background: color-mix(in srgb, white 50%, black)) {
        :root {
          --wui-color-modal-bg: color-mix(
            in srgb,
            var(--w3m-color-mix) var(--w3m-color-mix-strength),
            var(--wui-color-modal-bg-base)
          );

          --wui-box-shadow-blue: color-mix(in srgb, var(--wui-color-accent-100) 20%, transparent);

          --wui-color-accent-100: color-mix(
            in srgb,
            var(--wui-color-accent-base-100) 100%,
            transparent
          );
          --wui-color-accent-090: color-mix(
            in srgb,
            var(--wui-color-accent-base-100) 90%,
            transparent
          );
          --wui-color-accent-080: color-mix(
            in srgb,
            var(--wui-color-accent-base-100) 80%,
            transparent
          );
          --wui-color-accent-glass-090: color-mix(
            in srgb,
            var(--wui-color-accent-base-100) 90%,
            transparent
          );
          --wui-color-accent-glass-080: color-mix(
            in srgb,
            var(--wui-color-accent-base-100) 80%,
            transparent
          );
          --wui-color-accent-glass-020: color-mix(
            in srgb,
            var(--wui-color-accent-base-100) 20%,
            transparent
          );
          --wui-color-accent-glass-015: color-mix(
            in srgb,
            var(--wui-color-accent-base-100) 15%,
            transparent
          );
          --wui-color-accent-glass-010: color-mix(
            in srgb,
            var(--wui-color-accent-base-100) 10%,
            transparent
          );
          --wui-color-accent-glass-005: color-mix(
            in srgb,
            var(--wui-color-accent-base-100) 5%,
            transparent
          );
          --wui-color-accent-002: color-mix(
            in srgb,
            var(--wui-color-accent-base-100) 2%,
            transparent
          );

          --wui-color-fg-100: color-mix(
            in srgb,
            var(--w3m-color-mix) var(--w3m-color-mix-strength),
            var(--wui-color-fg-100)
          );
          --wui-color-fg-125: color-mix(
            in srgb,
            var(--w3m-color-mix) var(--w3m-color-mix-strength),
            var(--wui-color-fg-125)
          );
          --wui-color-fg-150: color-mix(
            in srgb,
            var(--w3m-color-mix) var(--w3m-color-mix-strength),
            var(--wui-color-fg-150)
          );
          --wui-color-fg-175: color-mix(
            in srgb,
            var(--w3m-color-mix) var(--w3m-color-mix-strength),
            var(--wui-color-fg-175)
          );
          --wui-color-fg-200: color-mix(
            in srgb,
            var(--w3m-color-mix) var(--w3m-color-mix-strength),
            var(--wui-color-fg-200)
          );
          --wui-color-fg-225: color-mix(
            in srgb,
            var(--w3m-color-mix) var(--w3m-color-mix-strength),
            var(--wui-color-fg-225)
          );
          --wui-color-fg-250: color-mix(
            in srgb,
            var(--w3m-color-mix) var(--w3m-color-mix-strength),
            var(--wui-color-fg-250)
          );
          --wui-color-fg-275: color-mix(
            in srgb,
            var(--w3m-color-mix) var(--w3m-color-mix-strength),
            var(--wui-color-fg-275)
          );
          --wui-color-fg-300: color-mix(
            in srgb,
            var(--w3m-color-mix) var(--w3m-color-mix-strength),
            var(--wui-color-fg-300)
          );
          --wui-color-fg-325: color-mix(
            in srgb,
            var(--w3m-color-mix) var(--w3m-color-mix-strength),
            var(--wui-color-fg-325)
          );
          --wui-color-fg-350: color-mix(
            in srgb,
            var(--w3m-color-mix) var(--w3m-color-mix-strength),
            var(--wui-color-fg-350)
          );

          --wui-color-bg-100: color-mix(
            in srgb,
            var(--w3m-color-mix) var(--w3m-color-mix-strength),
            var(--wui-color-bg-100)
          );
          --wui-color-bg-125: color-mix(
            in srgb,
            var(--w3m-color-mix) var(--w3m-color-mix-strength),
            var(--wui-color-bg-125)
          );
          --wui-color-bg-150: color-mix(
            in srgb,
            var(--w3m-color-mix) var(--w3m-color-mix-strength),
            var(--wui-color-bg-150)
          );
          --wui-color-bg-175: color-mix(
            in srgb,
            var(--w3m-color-mix) var(--w3m-color-mix-strength),
            var(--wui-color-bg-175)
          );
          --wui-color-bg-200: color-mix(
            in srgb,
            var(--w3m-color-mix) var(--w3m-color-mix-strength),
            var(--wui-color-bg-200)
          );
          --wui-color-bg-225: color-mix(
            in srgb,
            var(--w3m-color-mix) var(--w3m-color-mix-strength),
            var(--wui-color-bg-225)
          );
          --wui-color-bg-250: color-mix(
            in srgb,
            var(--w3m-color-mix) var(--w3m-color-mix-strength),
            var(--wui-color-bg-250)
          );
          --wui-color-bg-275: color-mix(
            in srgb,
            var(--w3m-color-mix) var(--w3m-color-mix-strength),
            var(--wui-color-bg-275)
          );
          --wui-color-bg-300: color-mix(
            in srgb,
            var(--w3m-color-mix) var(--w3m-color-mix-strength),
            var(--wui-color-bg-300)
          );
          --wui-color-bg-325: color-mix(
            in srgb,
            var(--w3m-color-mix) var(--w3m-color-mix-strength),
            var(--wui-color-bg-325)
          );
          --wui-color-bg-350: color-mix(
            in srgb,
            var(--w3m-color-mix) var(--w3m-color-mix-strength),
            var(--wui-color-bg-350)
          );

          --wui-color-success-100: color-mix(
            in srgb,
            var(--w3m-color-mix) var(--w3m-color-mix-strength),
            var(--wui-color-success-base-100)
          );
          --wui-color-success-125: color-mix(
            in srgb,
            var(--w3m-color-mix) var(--w3m-color-mix-strength),
            var(--wui-color-success-base-125)
          );

          --wui-color-warning-100: color-mix(
            in srgb,
            var(--w3m-color-mix) var(--w3m-color-mix-strength),
            var(--wui-color-warning-base-100)
          );

          --wui-color-error-100: color-mix(
            in srgb,
            var(--w3m-color-mix) var(--w3m-color-mix-strength),
            var(--wui-color-error-base-100)
          );
          --wui-color-blue-100: color-mix(
            in srgb,
            var(--w3m-color-mix) var(--w3m-color-mix-strength),
            var(--wui-color-blue-base-100)
          );
          --wui-color-blue-90: color-mix(
            in srgb,
            var(--w3m-color-mix) var(--w3m-color-mix-strength),
            var(--wui-color-blue-base-90)
          );
          --wui-color-error-125: color-mix(
            in srgb,
            var(--w3m-color-mix) var(--w3m-color-mix-strength),
            var(--wui-color-error-base-125)
          );

          --wui-icon-box-bg-error-100: color-mix(
            in srgb,
            var(--w3m-color-mix) var(--w3m-color-mix-strength),
            var(--wui-icon-box-bg-error-base-100)
          );
          --wui-icon-box-bg-accent-100: color-mix(
            in srgb,
            var(--w3m-color-mix) var(--w3m-color-mix-strength),
            var(--wui-icon-box-bg-blue-base-100)
          );
          --wui-icon-box-bg-success-100: color-mix(
            in srgb,
            var(--w3m-color-mix) var(--w3m-color-mix-strength),
            var(--wui-icon-box-bg-success-base-100)
          );
          --wui-icon-box-bg-inverse-100: color-mix(
            in srgb,
            var(--w3m-color-mix) var(--w3m-color-mix-strength),
            var(--wui-icon-box-bg-inverse-base-100)
          );

          --wui-all-wallets-bg-100: color-mix(
            in srgb,
            var(--w3m-color-mix) var(--w3m-color-mix-strength),
            var(--wui-all-wallets-bg-100)
          );

          --wui-avatar-border: color-mix(
            in srgb,
            var(--w3m-color-mix) var(--w3m-color-mix-strength),
            var(--wui-avatar-border-base)
          );

          --wui-thumbnail-border: color-mix(
            in srgb,
            var(--w3m-color-mix) var(--w3m-color-mix-strength),
            var(--wui-thumbnail-border-base)
          );

          --wui-wallet-button-bg: color-mix(
            in srgb,
            var(--w3m-color-mix) var(--w3m-color-mix-strength),
            var(--wui-wallet-button-bg-base)
          );
        }
      }
    `,light:t`
      :root {
        --w3m-color-mix: ${n(e?.[`--w3m-color-mix`]||`#fff`)};
        --w3m-accent: ${n(Fe(e,`dark`)[`--w3m-accent`])};
        --w3m-default: #fff;

        --wui-color-modal-bg-base: ${n(Fe(e,`dark`)[`--w3m-background`])};
        --wui-color-accent-base-100: var(--w3m-accent);

        --wui-color-blueberry-100: hsla(230, 100%, 67%, 1);
        --wui-color-blueberry-090: hsla(231, 76%, 61%, 1);
        --wui-color-blueberry-080: hsla(230, 59%, 55%, 1);
        --wui-color-blueberry-050: hsla(231, 100%, 70%, 0.1);

        --wui-color-fg-100: #e4e7e7;
        --wui-color-fg-125: #d0d5d5;
        --wui-color-fg-150: #a8b1b1;
        --wui-color-fg-175: #a8b0b0;
        --wui-color-fg-200: #949e9e;
        --wui-color-fg-225: #868f8f;
        --wui-color-fg-250: #788080;
        --wui-color-fg-275: #788181;
        --wui-color-fg-300: #6e7777;
        --wui-color-fg-325: #9a9a9a;
        --wui-color-fg-350: #363636;

        --wui-color-bg-100: #141414;
        --wui-color-bg-125: #191a1a;
        --wui-color-bg-150: #1e1f1f;
        --wui-color-bg-175: #222525;
        --wui-color-bg-200: #272a2a;
        --wui-color-bg-225: #2c3030;
        --wui-color-bg-250: #313535;
        --wui-color-bg-275: #363b3b;
        --wui-color-bg-300: #3b4040;
        --wui-color-bg-325: #252525;
        --wui-color-bg-350: #ffffff;

        --wui-color-success-base-100: #26d962;
        --wui-color-success-base-125: #30a46b;

        --wui-color-warning-base-100: #f3a13f;

        --wui-color-error-base-100: #f25a67;
        --wui-color-error-base-125: #df4a34;

        --wui-color-blue-base-100: rgba(102, 125, 255, 1);
        --wui-color-blue-base-90: rgba(102, 125, 255, 0.9);

        --wui-color-success-glass-001: rgba(38, 217, 98, 0.01);
        --wui-color-success-glass-002: rgba(38, 217, 98, 0.02);
        --wui-color-success-glass-005: rgba(38, 217, 98, 0.05);
        --wui-color-success-glass-010: rgba(38, 217, 98, 0.1);
        --wui-color-success-glass-015: rgba(38, 217, 98, 0.15);
        --wui-color-success-glass-020: rgba(38, 217, 98, 0.2);
        --wui-color-success-glass-025: rgba(38, 217, 98, 0.25);
        --wui-color-success-glass-030: rgba(38, 217, 98, 0.3);
        --wui-color-success-glass-060: rgba(38, 217, 98, 0.6);
        --wui-color-success-glass-080: rgba(38, 217, 98, 0.8);

        --wui-color-success-glass-reown-020: rgba(48, 164, 107, 0.2);

        --wui-color-warning-glass-reown-020: rgba(243, 161, 63, 0.2);

        --wui-color-error-glass-001: rgba(242, 90, 103, 0.01);
        --wui-color-error-glass-002: rgba(242, 90, 103, 0.02);
        --wui-color-error-glass-005: rgba(242, 90, 103, 0.05);
        --wui-color-error-glass-010: rgba(242, 90, 103, 0.1);
        --wui-color-error-glass-015: rgba(242, 90, 103, 0.15);
        --wui-color-error-glass-020: rgba(242, 90, 103, 0.2);
        --wui-color-error-glass-025: rgba(242, 90, 103, 0.25);
        --wui-color-error-glass-030: rgba(242, 90, 103, 0.3);
        --wui-color-error-glass-060: rgba(242, 90, 103, 0.6);
        --wui-color-error-glass-080: rgba(242, 90, 103, 0.8);

        --wui-color-error-glass-reown-020: rgba(223, 74, 52, 0.2);

        --wui-color-gray-glass-001: rgba(255, 255, 255, 0.01);
        --wui-color-gray-glass-002: rgba(255, 255, 255, 0.02);
        --wui-color-gray-glass-005: rgba(255, 255, 255, 0.05);
        --wui-color-gray-glass-010: rgba(255, 255, 255, 0.1);
        --wui-color-gray-glass-015: rgba(255, 255, 255, 0.15);
        --wui-color-gray-glass-020: rgba(255, 255, 255, 0.2);
        --wui-color-gray-glass-025: rgba(255, 255, 255, 0.25);
        --wui-color-gray-glass-030: rgba(255, 255, 255, 0.3);
        --wui-color-gray-glass-060: rgba(255, 255, 255, 0.6);
        --wui-color-gray-glass-080: rgba(255, 255, 255, 0.8);
        --wui-color-gray-glass-090: rgba(255, 255, 255, 0.9);

        --wui-color-dark-glass-100: rgba(42, 42, 42, 1);

        --wui-icon-box-bg-error-base-100: #3c2426;
        --wui-icon-box-bg-blue-base-100: #20303f;
        --wui-icon-box-bg-success-base-100: #1f3a28;
        --wui-icon-box-bg-inverse-base-100: #243240;

        --wui-all-wallets-bg-100: #222b35;

        --wui-avatar-border-base: #252525;

        --wui-thumbnail-border-base: #252525;

        --wui-wallet-button-bg-base: var(--wui-color-bg-125);

        --w3m-card-embedded-shadow-color: rgb(17 17 18 / 25%);
      }
    `,dark:t`
      :root {
        --w3m-color-mix: ${n(e?.[`--w3m-color-mix`]||`#000`)};
        --w3m-accent: ${n(Fe(e,`light`)[`--w3m-accent`])};
        --w3m-default: #000;

        --wui-color-modal-bg-base: ${n(Fe(e,`light`)[`--w3m-background`])};
        --wui-color-accent-base-100: var(--w3m-accent);

        --wui-color-blueberry-100: hsla(231, 100%, 70%, 1);
        --wui-color-blueberry-090: hsla(231, 97%, 72%, 1);
        --wui-color-blueberry-080: hsla(231, 92%, 74%, 1);

        --wui-color-fg-100: #141414;
        --wui-color-fg-125: #2d3131;
        --wui-color-fg-150: #474d4d;
        --wui-color-fg-175: #636d6d;
        --wui-color-fg-200: #798686;
        --wui-color-fg-225: #828f8f;
        --wui-color-fg-250: #8b9797;
        --wui-color-fg-275: #95a0a0;
        --wui-color-fg-300: #9ea9a9;
        --wui-color-fg-325: #9a9a9a;
        --wui-color-fg-350: #d0d0d0;

        --wui-color-bg-100: #ffffff;
        --wui-color-bg-125: #f5fafa;
        --wui-color-bg-150: #f3f8f8;
        --wui-color-bg-175: #eef4f4;
        --wui-color-bg-200: #eaf1f1;
        --wui-color-bg-225: #e5eded;
        --wui-color-bg-250: #e1e9e9;
        --wui-color-bg-275: #dce7e7;
        --wui-color-bg-300: #d8e3e3;
        --wui-color-bg-325: #f3f3f3;
        --wui-color-bg-350: #202020;

        --wui-color-success-base-100: #26b562;
        --wui-color-success-base-125: #30a46b;

        --wui-color-warning-base-100: #f3a13f;

        --wui-color-error-base-100: #f05142;
        --wui-color-error-base-125: #df4a34;

        --wui-color-blue-base-100: rgba(102, 125, 255, 1);
        --wui-color-blue-base-90: rgba(102, 125, 255, 0.9);

        --wui-color-success-glass-001: rgba(38, 181, 98, 0.01);
        --wui-color-success-glass-002: rgba(38, 181, 98, 0.02);
        --wui-color-success-glass-005: rgba(38, 181, 98, 0.05);
        --wui-color-success-glass-010: rgba(38, 181, 98, 0.1);
        --wui-color-success-glass-015: rgba(38, 181, 98, 0.15);
        --wui-color-success-glass-020: rgba(38, 181, 98, 0.2);
        --wui-color-success-glass-025: rgba(38, 181, 98, 0.25);
        --wui-color-success-glass-030: rgba(38, 181, 98, 0.3);
        --wui-color-success-glass-060: rgba(38, 181, 98, 0.6);
        --wui-color-success-glass-080: rgba(38, 181, 98, 0.8);

        --wui-color-success-glass-reown-020: rgba(48, 164, 107, 0.2);

        --wui-color-warning-glass-reown-020: rgba(243, 161, 63, 0.2);

        --wui-color-error-glass-001: rgba(240, 81, 66, 0.01);
        --wui-color-error-glass-002: rgba(240, 81, 66, 0.02);
        --wui-color-error-glass-005: rgba(240, 81, 66, 0.05);
        --wui-color-error-glass-010: rgba(240, 81, 66, 0.1);
        --wui-color-error-glass-015: rgba(240, 81, 66, 0.15);
        --wui-color-error-glass-020: rgba(240, 81, 66, 0.2);
        --wui-color-error-glass-025: rgba(240, 81, 66, 0.25);
        --wui-color-error-glass-030: rgba(240, 81, 66, 0.3);
        --wui-color-error-glass-060: rgba(240, 81, 66, 0.6);
        --wui-color-error-glass-080: rgba(240, 81, 66, 0.8);

        --wui-color-error-glass-reown-020: rgba(223, 74, 52, 0.2);

        --wui-icon-box-bg-error-base-100: #f4dfdd;
        --wui-icon-box-bg-blue-base-100: #d9ecfb;
        --wui-icon-box-bg-success-base-100: #daf0e4;
        --wui-icon-box-bg-inverse-base-100: #dcecfc;

        --wui-all-wallets-bg-100: #e8f1fa;

        --wui-avatar-border-base: #f3f4f4;

        --wui-thumbnail-border-base: #eaefef;

        --wui-wallet-button-bg-base: var(--wui-color-bg-125);

        --wui-color-gray-glass-001: rgba(0, 0, 0, 0.01);
        --wui-color-gray-glass-002: rgba(0, 0, 0, 0.02);
        --wui-color-gray-glass-005: rgba(0, 0, 0, 0.05);
        --wui-color-gray-glass-010: rgba(0, 0, 0, 0.1);
        --wui-color-gray-glass-015: rgba(0, 0, 0, 0.15);
        --wui-color-gray-glass-020: rgba(0, 0, 0, 0.2);
        --wui-color-gray-glass-025: rgba(0, 0, 0, 0.25);
        --wui-color-gray-glass-030: rgba(0, 0, 0, 0.3);
        --wui-color-gray-glass-060: rgba(0, 0, 0, 0.6);
        --wui-color-gray-glass-080: rgba(0, 0, 0, 0.8);
        --wui-color-gray-glass-090: rgba(0, 0, 0, 0.9);

        --wui-color-dark-glass-100: rgba(233, 233, 233, 1);

        --w3m-card-embedded-shadow-color: rgb(224 225 233 / 25%);
      }
    `}}var Pt=t`
  *,
  *::after,
  *::before,
  :host {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-style: normal;
    text-rendering: optimizeSpeed;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    -webkit-tap-highlight-color: transparent;
    font-family: var(--wui-font-family);
    backface-visibility: hidden;
  }
`,Ft=t`
  button,
  a {
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    transition:
      color var(--wui-duration-lg) var(--wui-ease-out-power-1),
      background-color var(--wui-duration-lg) var(--wui-ease-out-power-1),
      border var(--wui-duration-lg) var(--wui-ease-out-power-1),
      border-radius var(--wui-duration-lg) var(--wui-ease-out-power-1),
      box-shadow var(--wui-duration-lg) var(--wui-ease-out-power-1);
    will-change: background-color, color, border, box-shadow, border-radius;
    outline: none;
    border: none;
    column-gap: var(--wui-spacing-3xs);
    background-color: transparent;
    text-decoration: none;
  }

  wui-flex {
    transition: border-radius var(--wui-duration-lg) var(--wui-ease-out-power-1);
    will-change: border-radius;
  }

  button:disabled > wui-wallet-image,
  button:disabled > wui-all-wallets-image,
  button:disabled > wui-network-image,
  button:disabled > wui-image,
  button:disabled > wui-transaction-visual,
  button:disabled > wui-logo {
    filter: grayscale(1);
  }

  @media (hover: hover) and (pointer: fine) {
    button:hover:enabled {
      background-color: var(--wui-color-gray-glass-005);
    }

    button:active:enabled {
      background-color: var(--wui-color-gray-glass-010);
    }
  }

  button:disabled > wui-icon-box {
    opacity: 0.5;
  }

  input {
    border: none;
    outline: none;
    appearance: none;
  }
`,It=t`
  .wui-color-inherit {
    color: var(--wui-color-inherit);
  }

  .wui-color-accent-100 {
    color: var(--wui-color-accent-100);
  }

  .wui-color-error-100 {
    color: var(--wui-color-error-100);
  }

  .wui-color-blue-100 {
    color: var(--wui-color-blue-100);
  }

  .wui-color-blue-90 {
    color: var(--wui-color-blue-90);
  }

  .wui-color-error-125 {
    color: var(--wui-color-error-125);
  }

  .wui-color-success-100 {
    color: var(--wui-color-success-100);
  }

  .wui-color-success-125 {
    color: var(--wui-color-success-125);
  }

  .wui-color-inverse-100 {
    color: var(--wui-color-inverse-100);
  }

  .wui-color-inverse-000 {
    color: var(--wui-color-inverse-000);
  }

  .wui-color-fg-100 {
    color: var(--wui-color-fg-100);
  }

  .wui-color-fg-200 {
    color: var(--wui-color-fg-200);
  }

  .wui-color-fg-300 {
    color: var(--wui-color-fg-300);
  }

  .wui-color-fg-325 {
    color: var(--wui-color-fg-325);
  }

  .wui-color-fg-350 {
    color: var(--wui-color-fg-350);
  }

  .wui-bg-color-inherit {
    background-color: var(--wui-color-inherit);
  }

  .wui-bg-color-blue-100 {
    background-color: var(--wui-color-accent-100);
  }

  .wui-bg-color-error-100 {
    background-color: var(--wui-color-error-100);
  }

  .wui-bg-color-error-125 {
    background-color: var(--wui-color-error-125);
  }

  .wui-bg-color-success-100 {
    background-color: var(--wui-color-success-100);
  }

  .wui-bg-color-success-125 {
    background-color: var(--wui-color-success-100);
  }

  .wui-bg-color-inverse-100 {
    background-color: var(--wui-color-inverse-100);
  }

  .wui-bg-color-inverse-000 {
    background-color: var(--wui-color-inverse-000);
  }

  .wui-bg-color-fg-100 {
    background-color: var(--wui-color-fg-100);
  }

  .wui-bg-color-fg-200 {
    background-color: var(--wui-color-fg-200);
  }

  .wui-bg-color-fg-300 {
    background-color: var(--wui-color-fg-300);
  }

  .wui-color-fg-325 {
    background-color: var(--wui-color-fg-325);
  }

  .wui-color-fg-350 {
    background-color: var(--wui-color-fg-350);
  }
`,Lt={getSpacingStyles(e,t){if(Array.isArray(e))return e[t]?`var(--wui-spacing-${e[t]})`:void 0;if(typeof e==`string`)return`var(--wui-spacing-${e})`},getFormattedDate(e){return new Intl.DateTimeFormat(`en-US`,{month:`short`,day:`numeric`}).format(e)},getHostName(e){try{return new URL(e).hostname}catch{return``}},getTruncateString({string:e,charsStart:t,charsEnd:n,truncate:r}){return e.length<=t+n?e:r===`end`?`${e.substring(0,t)}...`:r===`start`?`...${e.substring(e.length-n)}`:`${e.substring(0,Math.floor(t))}...${e.substring(e.length-Math.floor(n))}`},generateAvatarColors(e){let t=e.toLowerCase().replace(/^0x/iu,``).replace(/[^a-f0-9]/gu,``).substring(0,6).padEnd(6,`0`),n=this.hexToRgb(t),r=getComputedStyle(document.documentElement).getPropertyValue(`--w3m-border-radius-master`),i=100-3*Number(r?.replace(`px`,``)),a=`${i}% ${i}% at 65% 40%`,o=[];for(let e=0;e<5;e+=1){let t=this.tintColor(n,.15*e);o.push(`rgb(${t[0]}, ${t[1]}, ${t[2]})`)}return`
    --local-color-1: ${o[0]};
    --local-color-2: ${o[1]};
    --local-color-3: ${o[2]};
    --local-color-4: ${o[3]};
    --local-color-5: ${o[4]};
    --local-radial-circle: ${a}
   `},hexToRgb(e){let t=parseInt(e,16);return[t>>16&255,t>>8&255,t&255]},tintColor(e,t){let[n,r,i]=e;return[Math.round(n+(255-n)*t),Math.round(r+(255-r)*t),Math.round(i+(255-i)*t)]},isNumber(e){return{number:/^[0-9]+$/u}.number.test(e)},getColorTheme(e){return e||(typeof window<`u`&&window.matchMedia?window.matchMedia(`(prefers-color-scheme: dark)`)?.matches?`dark`:`light`:`dark`)},splitBalance(e){let t=e.split(`.`);return t.length===2?[t[0],t[1]]:[`0`,`00`]},roundNumber(e,t,n){return e.toString().length>=t?Number(e).toFixed(n):e},formatNumberToLocalString(e,t=2){return e===void 0?`0.00`:typeof e==`number`?e.toLocaleString(`en-US`,{maximumFractionDigits:t,minimumFractionDigits:t}):parseFloat(e).toLocaleString(`en-US`,{maximumFractionDigits:t,minimumFractionDigits:t})}};function Rt(e,t){let{kind:n,elements:r}=t;return{kind:n,elements:r,finisher(t){customElements.get(e)||customElements.define(e,t)}}}function zt(e,t){return customElements.get(e)||customElements.define(e,t),t}function Bt(e){return function(t){return typeof t==`function`?zt(e,t):Rt(e,t)}}var Vt={ACCOUNT_TABS:[{label:`Tokens`},{label:`NFTs`},{label:`Activity`}],SECURE_SITE_ORIGIN:(typeof process<`u`?{}.NEXT_PUBLIC_SECURE_SITE_ORIGIN:void 0)||`https://secure.walletconnect.org`,VIEW_DIRECTION:{Next:`next`,Prev:`prev`},DEFAULT_CONNECT_METHOD_ORDER:[`email`,`social`,`wallet`],ANIMATION_DURATIONS:{HeaderText:120,ModalHeight:150,ViewTransition:150}};export{T as A,N as C,k as D,M as E,b as F,y as I,_ as L,Re as M,Le as N,O,ce as P,oe as R,I as S,$e as T,mt as _,Ft as a,ut as b,jt as c,Q as d,X as f,W as g,vt as h,It as i,w as j,E as k,Mt as l,K as m,Bt as n,At as o,J as p,Lt as r,Pt as s,Vt as t,Et as u,ft as v,tt as w,R as x,B as y,v as z};