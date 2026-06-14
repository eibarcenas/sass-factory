# Firebase Auth + Firestore emulators, pinned to a firebase-tools version that
# still runs on the bundled JDK 17 (>=14 hard-requires JDK 21). Self-contained
# so the live test is portable and never touches the host's Java install.
FROM node:20-bookworm-slim
RUN apt-get update \
 && apt-get install -y --no-install-recommends openjdk-17-jre-headless ca-certificates \
 && rm -rf /var/lib/apt/lists/*
RUN npm install -g firebase-tools@12.9.1
WORKDIR /work
COPY firebase.json /work/firebase.json
EXPOSE 8080 9099
CMD ["firebase", "emulators:start", "--only", "auth,firestore", "--project", "demo-eguru"]
