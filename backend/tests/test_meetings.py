"""Unit/integration tests for the meeting endpoints."""
from datetime import datetime, timedelta


def _create_meeting(client, title="Unit Test Meeting"):
    return client.post(
        "/api/meeting/create",
        json={
            "title": title,
            "host_name": "Host User",
            "host_email": "host@example.com",
        },
    )


class TestHealth:
    def test_health_check(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "healthy"
        assert body["database"] == "connected"


class TestCreateMeeting:
    def test_create_meeting_success(self, client):
        resp = _create_meeting(client)
        assert resp.status_code == 201
        body = resp.json()
        assert body["success"] is True
        data = body["data"]
        assert data["title"] == "Unit Test Meeting"
        assert data["status"] == "active"
        assert data["meeting_code"]
        assert data["invite_url"].startswith("http")
        assert data["participant_count"] == 1  # host auto-joins

    def test_create_meeting_missing_fields_returns_422(self, client):
        resp = client.post("/api/meeting/create", json={"host_name": "Host"})
        assert resp.status_code == 422

    def test_create_meeting_generates_unique_codes(self, client):
        codes = set()
        for _ in range(5):
            resp = _create_meeting(client)
            codes.add(resp.json()["data"]["meeting_code"])
        assert len(codes) == 5


class TestJoinMeeting:
    def test_join_meeting_by_code(self, client):
        create_resp = _create_meeting(client)
        meeting_code = create_resp.json()["data"]["meeting_code"]

        join_resp = client.post(
            "/api/meeting/join",
            json={
                "meeting_id": meeting_code,
                "participant_name": "Joiner",
                "participant_email": "joiner@example.com",
            },
        )
        assert join_resp.status_code == 200
        body = join_resp.json()["data"]
        assert body["meeting"]["meeting_code"] == meeting_code
        assert body["meeting"]["participant_count"] == 2

    def test_join_meeting_by_invite_url(self, client):
        create_resp = _create_meeting(client)
        invite_url = create_resp.json()["data"]["invite_url"]

        join_resp = client.post(
            "/api/meeting/join",
            json={
                "invite_url": invite_url,
                "participant_name": "Joiner",
                "participant_email": "joiner2@example.com",
            },
        )
        assert join_resp.status_code == 200

    def test_join_nonexistent_meeting_returns_404(self, client):
        resp = client.post(
            "/api/meeting/join",
            json={
                "meeting_id": "zzz-zzzz-zzz",
                "participant_name": "Ghost",
                "participant_email": "ghost@example.com",
            },
        )
        assert resp.status_code == 404
        assert resp.json()["error"]["code"] == "MEETING_NOT_FOUND"

    def test_join_without_identifier_returns_422(self, client):
        resp = client.post(
            "/api/meeting/join",
            json={"participant_name": "Nobody", "participant_email": "nobody@example.com"},
        )
        assert resp.status_code == 422


class TestScheduleMeeting:
    def test_schedule_meeting_success(self, client):
        future_date = (datetime.utcnow() + timedelta(days=5)).strftime("%Y-%m-%d")
        resp = client.post(
            "/api/meeting/schedule",
            json={
                "title": "Future Meeting",
                "description": "A scheduled meeting",
                "date": future_date,
                "time": "14:30",
                "duration_minutes": 60,
                "host_name": "Scheduler",
                "host_email": "scheduler@example.com",
            },
        )
        assert resp.status_code == 201
        data = resp.json()["data"]
        assert data["title"] == "Future Meeting"
        assert data["status"] == "upcoming"

    def test_schedule_meeting_in_past_fails(self, client):
        past_date = (datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%d")
        resp = client.post(
            "/api/meeting/schedule",
            json={
                "title": "Past Meeting",
                "date": past_date,
                "time": "09:00",
                "duration_minutes": 30,
                "host_name": "Scheduler",
                "host_email": "scheduler2@example.com",
            },
        )
        assert resp.status_code == 422
        assert resp.json()["error"]["code"] == "INVALID_SCHEDULE"

    def test_schedule_meeting_negative_duration_fails(self, client):
        future_date = (datetime.utcnow() + timedelta(days=2)).strftime("%Y-%m-%d")
        resp = client.post(
            "/api/meeting/schedule",
            json={
                "title": "Bad Duration",
                "date": future_date,
                "time": "09:00",
                "duration_minutes": -10,
                "host_name": "Scheduler",
                "host_email": "scheduler3@example.com",
            },
        )
        assert resp.status_code == 422

    def test_schedule_meeting_invalid_date_format_fails(self, client):
        resp = client.post(
            "/api/meeting/schedule",
            json={
                "title": "Bad Date",
                "date": "05-12-2026",
                "time": "09:00",
                "duration_minutes": 30,
                "host_name": "Scheduler",
                "host_email": "scheduler4@example.com",
            },
        )
        assert resp.status_code == 422


class TestListingAndDetail:
    def test_upcoming_meetings_list(self, client):
        future_date = (datetime.utcnow() + timedelta(days=3)).strftime("%Y-%m-%d")
        client.post(
            "/api/meeting/schedule",
            json={
                "title": "Upcoming Test",
                "date": future_date,
                "time": "10:00",
                "duration_minutes": 30,
                "host_name": "Host",
                "host_email": "upcominghost@example.com",
            },
        )
        resp = client.get("/api/meeting/upcoming")
        assert resp.status_code == 200
        assert len(resp.json()["data"]) >= 1

    def test_recent_meetings_list(self, client):
        _create_meeting(client)
        resp = client.get("/api/meeting/recent")
        assert resp.status_code == 200
        assert len(resp.json()["data"]) >= 1

    def test_meeting_detail_by_code(self, client):
        create_resp = _create_meeting(client)
        meeting_code = create_resp.json()["data"]["meeting_code"]
        resp = client.get(f"/api/meeting/{meeting_code}")
        assert resp.status_code == 200
        assert resp.json()["data"]["meeting_code"] == meeting_code

    def test_meeting_detail_not_found(self, client):
        resp = client.get("/api/meeting/does-not-exist")
        assert resp.status_code == 404


class TestDeleteMeeting:
    def test_delete_meeting_success(self, client):
        create_resp = _create_meeting(client)
        meeting_id = create_resp.json()["data"]["id"]

        del_resp = client.delete(f"/api/meeting/{meeting_id}")
        assert del_resp.status_code == 200

        get_resp = client.get(f"/api/meeting/{meeting_id}")
        assert get_resp.status_code == 404

    def test_delete_nonexistent_meeting_returns_404(self, client):
        resp = client.delete("/api/meeting/does-not-exist")
        assert resp.status_code == 404
