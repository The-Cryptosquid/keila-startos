# Builds Keila from the `keila/` submodule, following upstream's ops/Dockerfile.
# Upstream publishes pentacent/keila for linux/amd64 only, so the package builds
# its own image for every architecture StartOS supports.
FROM elixir:1.20-otp-29-alpine AS build

ENV MIX_ENV=prod

RUN apk add git npm build-base openssl cmake patch

WORKDIR /build

COPY ./keila/mix.exs ./keila/mix.lock ./
COPY ./keila/config ./config
RUN mix local.hex --force && \
    mix local.rebar --force && \
    mix deps.get && \
    mix deps.compile

COPY ./keila/assets/package.json ./keila/assets/package-lock.json ./assets/
RUN npm ci --prefix ./assets

COPY ./keila .
# Upstream deltas we carry — see patches/README.md for what each one is and the
# condition that retires it. --fuzz=0 so a submodule bump that changes the context
# fails the build loudly instead of applying somewhere subtly wrong.
COPY ./patches ./patches
RUN set -e; for p in ./patches/*.patch; do [ -e "$p" ] || continue; echo "applying $p"; patch -p1 --fuzz=0 <"$p"; done

RUN mix deps.clean mime --build && \
    mix assets.deploy && \
    mix release

FROM elixir:1.20-otp-29-alpine
ENV HOME=/opt/app

WORKDIR ${HOME}
COPY --from=build /build/_build/prod/rel/keila ${HOME}
RUN apk add openssl
RUN mkdir -p ${HOME}/uploads && \
    adduser -s /bin/sh -u 1001 -G root -h ${HOME} -S -D default && \
    chown -R 1001:0 ${HOME}
ENTRYPOINT ["/opt/app/bin/keila"]
CMD ["start"]

ENV PORT=4000
EXPOSE 4000/tcp
