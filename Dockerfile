FROM node:lts-slim

RUN mkdir /app

WORKDIR /app

COPY build/* ./
COPY node_modules ./node_modules

RUN echo '\
#!/usr/bin/env bash\n \
echo Launching api-mocker...\n \
node ./index.js\n ' > entrypoint.sh
RUN chmod +x entrypoint.sh 

ENTRYPOINT [ "bash", "-c" ]
CMD [ "./entrypoint.sh" ]