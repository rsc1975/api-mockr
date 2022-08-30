FROM denoland/deno:alpine

RUN mkdir /app /config

VOLUME /config

WORKDIR /app

ADD api-mockr.ts ./
ADD src/config ./config/
ADD version.txt /version.txt

RUN echo -e '#!/bin/sh\n \
echo Launching api-mockr...\n \
echo PARAMS: $@ \n \
deno run -A ./api-mockr.ts $@ $MOCKR_PARAMS\n ' > /entrypoint.sh
RUN chmod +x /entrypoint.sh 

ENV MOCKR_PARAMS=""

ENTRYPOINT [ "/entrypoint.sh" ]
