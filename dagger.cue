package daggerazuredevops

import (
	"dagger.io/dagger"
	"dagger.io/dagger/core"
	"universe.dagger.io/bash"
	"universe.dagger.io/docker"
)

dagger.#Plan & {
	_nodeModulesMount: "/src/node_modules": {
		dest:     "/src/node_modules"
		type:     "cache"
		contents: core.#CacheDir & {
			id: "daggerazuredevops-modules-cache"
		}

	}
	client: {
		filesystem: {
			"./": read: {
				contents: dagger.#FS
				exclude: [
					"README.md",
					"_build",
					"dist",
					"out",
					"daggerazuredevops.cue",
					"node_modules",
				]
			}
			"./_build": write: contents: actions.build.contents.output
		}
	}
	actions: {
		deps: docker.#Build & {
			steps: [
        docker.#Dockerfile & {
          source: client.filesystem."./".read.contents

          dockerfile: contents: #"""
            FROM node:16
          """#
        },
				docker.#Copy & {
					contents: client.filesystem."./".read.contents
					dest:     "/src"
				},
				bash.#Run & {
					workdir: "/src"
					mounts: {
						_nodeModulesMount
					}
					script: contents: #"""
					 	npm install
					"""#
				},
			]
		}

		// test: bash.#Run & {
		// 	input:   deps.output
		// 	workdir: "/src"
		// 	mounts:  _nodeModulesMount
		// 	script: contents: #"""
		// 		yarn run test
		// 		"""#
		// }

		build: {
			run: bash.#Run & {
				input:   deps.output
				mounts:  _nodeModulesMount
				workdir: "/src"
				script: contents: #"""
					npm run build
				"""#
			}

			contents: core.#Subdir & {
				input: run.output.rootfs
				path:  "/src/out"
			}
		}
	}
}
