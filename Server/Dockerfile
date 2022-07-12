FROM node:10.18-stretch

ENV ROOT=/app \
    HOST=0.0.0.0 \
    PORT=4000

WORKDIR $ROOT

# Fixes `npm update check failed` error
# https://stackoverflow.com/a/60525400/6390238
RUN npm config set update-notifier false
RUN echo $ROOT
COPY ./package*.json /app/

# RUN if [ -f $ROOT/package-lock.json ]; \
#   then \
#     echo '> Running npm ci...' && npm ci; \
#   else \
#     echo '> Running npm install...' && npm install --loglevel=error --no-audit; \
# fi

RUN npm install
# RUN npm install

COPY . .

ARG __NODE_NPMAUDIT=false
ARG __NODE_NPMAUDITDESTINATION

RUN if [ "$__NODE_NPMAUDIT" = "true" ]; then \
    echo '> Auditing package dependencies for security vulnerabilities...'; \
    npm audit --production --json > liara__audit.json; \
    fi

ARG __NODE_TIMEZONE=Asia/Tehran
ENV TZ=${__NODE_TIMEZONE}
RUN echo '> Configuring timezone:' $TZ && ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezonero

ARG __VOLUME_PATH
ENV __VOLUME_PATH=${__VOLUME_PATH}

# RUN cp .env.example .env

CMD ["node","app.js"]

EXPOSE $PORT