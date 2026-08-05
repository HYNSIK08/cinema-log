package com.cinemalog.app.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record HideRequest(@JsonProperty("isHidden") boolean hidden) {}
