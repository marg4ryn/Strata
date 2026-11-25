# 0009. WebSocket for Analysis Run

- **Status:** Accepted
- **Date:** 2026-09-08
- **Category:** Feature: Analysis Run

## Context

During an analysis, the client needs bidirectional communication with the server. The client must be able to receive analysis updates while also sending commands, such as a request to stop the ongoing analysis. Most importantly, the connection may need to be re-established if it is interrupted.

## Decision

WebSocket was chosen as the communication protocol between the client and server. It provides persistent, bidirectional communication over a single connection, allowing the client to both receive updates and send commands, including a request to cancel the analysis.

Reconnection after a connection loss is handled by custom client-side logic.

## Alternatives Considered

- **Server-Sent Events (SSE)** – SSE provides only one-way communication from the server to the client. Sending commands such as stopping the analysis would require a separate channel (e.g. HTTP requests), splitting the analysis communication across two mechanisms.

## Consequences

- **Positive:** reliable control over the analysis lifecycle through a single bidirectional channel.
- **Negative:** reconnection and connection lifecycle management must be implemented manually.