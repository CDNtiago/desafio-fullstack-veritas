package task

import (
	"strings"
	"testing"
)

func TestValidate(t *testing.T) {
	for _, tc := range []struct {
		name  string
		input Input
		valid bool
	}{
		{"trim", Input{"  Planejar  ", "", Todo}, true},
		{"unicode boundary", Input{strings.Repeat("🧭", 120), strings.Repeat("á", 2000), Done}, true},
		{"empty", Input{" \n\t", "", Todo}, false},
		{"title long", Input{strings.Repeat("🧭", 121), "", Todo}, false},
		{"description long", Input{"Título", strings.Repeat("á", 2001), Todo}, false},
		{"invalid status", Input{"Título", "", "admin"}, false},
		{"plain text", Input{"<script>alert(1)</script>", "' OR 1=1", InProgress}, true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			got, err := Validate(tc.input)
			if (err == nil) != tc.valid {
				t.Fatalf("valid=%v, err=%v", tc.valid, err)
			}
			if tc.valid && got.Title != strings.TrimSpace(tc.input.Title) {
				t.Fatal("title not trimmed")
			}
		})
	}
}

func TestValidID(t *testing.T) {
	for _, id := range []string{"", "../tasks", strings.Repeat("G", 32), strings.Repeat("A", 32)} {
		if ValidID(id) {
			t.Errorf("accepted %q", id)
		}
	}
	if !ValidID(strings.Repeat("a", 32)) {
		t.Fatal("valid id rejected")
	}
}
