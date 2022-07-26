FROM node:lts-slim

RUN mkdir /app /config

VOLUME /config

WORKDIR /app

ADD dist ./

RUN echo '\
#!/usr/bin/env bash\n \
echo Launching api-mockr...\n \
node ./api-mockr.min.js $MOCKER_PARAMS\n ' > entrypoint.sh
RUN chmod +x entrypoint.sh 

ENV MOCKER_PARAMS=""

CMD [ "./entrypoint.sh" ]
