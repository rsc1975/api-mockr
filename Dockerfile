FROM node:lts-slim

RUN mkdir /app /config

VOLUME /config

WORKDIR /app

ADD dist ./

RUN echo '\
#!/usr/bin/env bash\n \
echo Launching api-mocker...\n \
node ./api-mocker.js $MOCKER_PARAMS\n ' > entrypoint.sh
RUN chmod +x entrypoint.sh 

ENV MOCKER_PARAMS=""

CMD [ "./entrypoint.sh" ]
