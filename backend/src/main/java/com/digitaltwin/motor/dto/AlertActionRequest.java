package com.digitaltwin.motor.dto;

public class AlertActionRequest {
    private String operatorNote;

    public AlertActionRequest() {}

    public AlertActionRequest(String operatorNote) {
        this.operatorNote = operatorNote;
    }

    public String getOperatorNote() { return operatorNote; }
    public void setOperatorNote(String operatorNote) { this.operatorNote = operatorNote; }
}
