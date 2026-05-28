// build.js
const esbuild = require('esbuild');
const path = require('path');

async function runBuild() {
  try {
    console.log('📦 Bundling NestJS for Cloudflare Edge...');
    
    await esbuild.build({
      entryPoints: [path.resolve(__dirname, 'src/index.ts')],
      bundle: true,
      outfile: path.resolve(__dirname, 'dist/worker.js'),
      format: 'esm', 
      target: 'es2022',
      platform: 'browser', 
      minify: false, // Turn off minification temporarily so we can debug lines if needed
      
      banner: {
        js: `
          import { createRequire } from 'node:module';
          const require = createRequire('/');
          const global = globalThis;
          const process = {
            env: { NODE_ENV: 'production' },
            nextTick: (cb, ...args) => queueMicrotask(() => cb(...args)),
            cwd: () => '/',
            stdout: { write: () => {} },
            stderr: { write: () => {} },
            version: 'v20.0.0',
            versions: { node: '20.0.0' }
          };
          const setImmediate = (cb, ...args) => setTimeout(cb, 0, ...args);
          const clearImmediate = (id) => clearTimeout(id);
          globalThis.process = process;
          globalThis.setImmediate = setImmediate;
          globalThis.clearImmediate = clearImmediate;
        `,
      },

      external: [
        'class-validator', 'class-transformer', '@nestjs/websockets', 
        '@nestjs/microservices', '@nestjs/platform-express', '@fastify/view', 
        'kafkajs', 'mqtt', 'nats', 'ioredis', 'amqplib', 'amqp-connection-manager', 
        '@grpc/grpc-js', '@grpc/proto-loader', '@nestjs/platform-socket.io',
        
        'assert', 'async_hooks', 'buffer', 'crypto', 'events', 'fs', 'http', 'https', 
        'net', 'os', 'path', 'querystring', 'stream', 'string_decoder', 'tls', 'tty', 
        'url', 'util', 'zlib', 'perf_hooks', 'repl',
        'node:assert', 'node:async_hooks', 'node:buffer', 'node:crypto', 
        'node:diagnostics_channel', 'node:dns', 'node:events', 'node:fs', 
        'node:fs/promises', 'node:http', 'node:http2', 'node:https', 'node:net', 
        'node:os', 'node:path', 'node:querystring', 'node:stream', 'node:string_decoder', 
        'node:url', 'node:util', 'node:zlib'
      ],
      
      conditions: ['worker', 'browser'],

      // FORCE STUB INTERCEPTIONS BELOW
    // Inside build.js -> plugins array
// Inside your build.js definition -> plugins array
plugins: [
  {
    name: 'edge-stubs',
    setup(build) {
      // Intercept both middie and pdfkit dependency resolution paths
      build.onResolve({ filter: /middie|pdfkit/ }, (args) => {
        return { path: args.path, namespace: 'stub-environment' };
      });
      
      build.onLoad({ filter: /.*/, namespace: 'stub-environment' }, () => {
        return {
          contents: `
            // 1. Core functional stub that satisfies both async promise and callback pipelines
            function stubPlugin(instance, opts, next) {
              if (typeof next === 'function') {
                next();
              }
              return Promise.resolve();
            }

            // 2. Add the Fastify-Plugin framework metadata flags directly to the object.
            // This signals to Avvio to skip contextual isolation wrapper loops entirely!
            stubPlugin[Symbol.for('skip-override')] = true;
            stubPlugin.fastify = '>=3.0.0'; 

            // 3. Export as a unified factory layout
            export default stubPlugin;
            export const register = stubPlugin;
            export const fastifyMiddie = stubPlugin;
          `,
          loader: 'js',
        };
      });
    },
  },
],
    });

    console.log('✅ Edge Bundle completed successfully: dist/worker.js');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

runBuild();